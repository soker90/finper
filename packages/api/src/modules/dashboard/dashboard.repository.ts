import { eq, and, gte, lt } from 'drizzle-orm'
import { type DB, schema } from '@soker90/finper-db'
import { roundNumber } from '../../utils/roundNumber'

const { accounts, loans, transactions, categories, stores, budgets } = schema

const EXPENSE = 'expense'
const INCOME = 'income'

// Año/mes/día de un timestamp en zona Europe/Madrid (1:1 con $year/$month/$dayOfMonth timezone del viejo).
const partsInMadrid = (date: number): { year: number, month: number, day: number } => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(new Date(date))
  const get = (t: string) => Number(parts.find(p => p.type === t)!.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

export interface MonthlyData { year: number, month: number, income: number, expenses: number }
export interface CategorySpendingRow { categoryId: string, name: string, total: number, count: number }
export interface CategoryHistoryRow { categoryId: string, name: string, avgMonthly: number }
export interface MonthTransactionsRow { transactions: number[], total: number, count: number }
export interface BudgetRow { categoryId: string, name: string, amount: number }

export const createDashboardRepository = (db: DB) => {
  // Mapa categoryId -> { name, parentId } para resolver nombres y jerarquía.
  const categoryMap = (user: string): Map<string, { name: string, parentId: string | null }> => {
    const rows = db.select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories).where(eq(categories.user, user)).all()
    return new Map(rows.map(r => [r.id, { name: r.name, parentId: r.parentId }]))
  }

  // Transacciones en [from, to) opcionalmente filtradas por tipo.
  const txInRange = (user: string, from: number, to: number, type?: string) => {
    const conds = [eq(transactions.user, user), gte(transactions.date, from), lt(transactions.date, to)]
    if (type) conds.push(eq(transactions.type, type))
    return db.select({
      date: transactions.date,
      categoryId: transactions.categoryId,
      amount: transactions.amount,
      type: transactions.type,
      storeId: transactions.storeId
    }).from(transactions).where(and(...conds)).all()
  }

  return {
    // 1. Suma de balances de cuentas activas.
    sumActiveAccountsBalance: (user: string): number => {
      const rows = db.select({ balance: accounts.balance }).from(accounts)
        .where(and(eq(accounts.user, user), eq(accounts.isActive, true))).all()
      return roundNumber(rows.reduce((s, r) => s + r.balance, 0))
    },

    // 3. Suma de capital pendiente de préstamos activos.
    sumPendingLoans: (user: string): number => {
      const rows = db.select({ pendingAmount: loans.pendingAmount }).from(loans)
        .where(eq(loans.user, user)).all()
      return roundNumber(rows.filter(r => r.pendingAmount > 0).reduce((s, r) => s + r.pendingAmount, 0))
    },

    // 4/5. Ingresos y gastos en un rango.
    monthIncomeExpenses: (user: string, from: number, to: number): { income: number, expenses: number } => {
      let income = 0; let expenses = 0
      for (const tx of txInRange(user, from, to)) {
        if (tx.type === INCOME) income += tx.amount
        else if (tx.type === EXPENSE) expenses += tx.amount
      }
      return { income, expenses }
    },

    // 6. Resumen mensual [{ year, month, income, expenses }] (mes Madrid, 1-indexed), ordenado.
    last6MonthsSummary: (user: string, from: number, to: number): MonthlyData[] => {
      const grouped = new Map<string, MonthlyData>()
      for (const tx of txInRange(user, from, to)) {
        if (tx.type !== INCOME && tx.type !== EXPENSE) continue
        const { year, month } = partsInMadrid(tx.date)
        const key = `${year}-${month}`
        const entry = grouped.get(key) ?? { year, month, income: 0, expenses: 0 }
        if (tx.type === INCOME) entry.income += tx.amount
        else entry.expenses += tx.amount
        grouped.set(key, entry)
      }
      return [...grouped.values()].sort((a, b) => a.year - b.year || a.month - b.month)
    },

    // 7/8. Gasto diario (día Madrid) -> [{ _id: day, amount }] ordenado por día.
    dailyExpenses: (user: string, from: number, to: number): Array<{ _id: number, amount: number }> => {
      const grouped = new Map<number, number>()
      for (const tx of txInRange(user, from, to, EXPENSE)) {
        const { day } = partsInMadrid(tx.date)
        grouped.set(day, (grouped.get(day) ?? 0) + tx.amount)
      }
      return [...grouped.entries()].map(([day, amount]) => ({ _id: day, amount })).sort((a, b) => a._id - b._id)
    },

    // 9. Top categorías de gasto con name y parentName, ordenadas desc.
    topExpenseCategories: (user: string, from: number, to: number): Array<{ name: string, parentName: string | null, amount: number }> => {
      const cats = categoryMap(user)
      const grouped = new Map<string, number>()
      for (const tx of txInRange(user, from, to, EXPENSE)) {
        grouped.set(tx.categoryId, (grouped.get(tx.categoryId) ?? 0) + tx.amount)
      }
      return [...grouped.entries()].map(([categoryId, amount]) => {
        const cat = cats.get(categoryId)
        const parentName = cat?.parentId ? (cats.get(cat.parentId)?.name ?? null) : null
        return { name: cat?.name ?? 'Sin categoría', parentName, amount: roundNumber(amount) }
      }).sort((a, b) => b.amount - a.amount)
    },

    // 10. Top tiendas de gasto con name, ordenadas desc.
    topExpenseStores: (user: string, from: number, to: number): Array<{ name: string, amount: number }> => {
      const storeRows = db.select({ id: stores.id, name: stores.name }).from(stores).where(eq(stores.user, user)).all()
      const storeNames = new Map(storeRows.map(s => [s.id, s.name]))
      const grouped = new Map<string, number>()
      for (const tx of txInRange(user, from, to, EXPENSE)) {
        if (!tx.storeId) continue
        grouped.set(tx.storeId, (grouped.get(tx.storeId) ?? 0) + tx.amount)
      }
      return [...grouped.entries()].map(([storeId, amount]) => ({
        name: storeNames.get(storeId) ?? 'Sin tienda', amount: roundNumber(amount)
      })).sort((a, b) => b.amount - a.amount)
    },

    // 13. Gasto real total del rango.
    realExpenses: (user: string, from: number, to: number): number =>
      roundNumber(txInRange(user, from, to, EXPENSE).reduce((s, tx) => s + tx.amount, 0)),

    // 14. Gasto del mes por categoría con name [{ categoryId, name, total, count }].
    currentMonthByCategory: (user: string, from: number, to: number): CategorySpendingRow[] => {
      const cats = categoryMap(user)
      const grouped = new Map<string, { total: number, count: number }>()
      for (const tx of txInRange(user, from, to, EXPENSE)) {
        const entry = grouped.get(tx.categoryId) ?? { total: 0, count: 0 }
        entry.total += tx.amount; entry.count += 1
        grouped.set(tx.categoryId, entry)
      }
      const result: CategorySpendingRow[] = []
      for (const [categoryId, { total, count }] of grouped) {
        const cat = cats.get(categoryId)
        if (!cat) continue // $unwind descarta categorías inexistentes
        result.push({ categoryId, name: cat.name, total: roundNumber(total), count })
      }
      return result
    },

    // 15. Media mensual de gasto por categoría [{ categoryId, name, avgMonthly }].
    last3MonthsAvgByCategory: (user: string, from: number, to: number): CategoryHistoryRow[] => {
      const cats = categoryMap(user)
      const monthly = new Map<string, Map<string, number>>() // categoryId -> (year-month -> total)
      for (const tx of txInRange(user, from, to, EXPENSE)) {
        const { year, month } = partsInMadrid(tx.date)
        const ym = `${year}-${month}`
        const perCat = monthly.get(tx.categoryId) ?? new Map<string, number>()
        perCat.set(ym, (perCat.get(ym) ?? 0) + tx.amount)
        monthly.set(tx.categoryId, perCat)
      }
      const result: CategoryHistoryRow[] = []
      for (const [categoryId, perCat] of monthly) {
        const cat = cats.get(categoryId)
        if (!cat) continue
        const totals = [...perCat.values()]
        const avgMonthly = totals.reduce((s, t) => s + t, 0) / totals.length
        result.push({ categoryId, name: cat.name, avgMonthly })
      }
      return result
    },

    // 16. Transacciones de gasto agrupadas por mes [{ transactions, total, count }].
    last3MonthsTransactions: (user: string, from: number, to: number): MonthTransactionsRow[] => {
      const grouped = new Map<string, MonthTransactionsRow>()
      for (const tx of txInRange(user, from, to, EXPENSE)) {
        const { year, month } = partsInMadrid(tx.date)
        const key = `${year}-${month}`
        const entry = grouped.get(key) ?? { transactions: [], total: 0, count: 0 }
        entry.transactions.push(tx.amount); entry.total += tx.amount; entry.count += 1
        grouped.set(key, entry)
      }
      return [...grouped.values()]
    },

    // 17. Budgets del mes (1-indexed) con name [{ categoryId, name, amount }].
    currentBudgets: (user: string, year: number, month: number): BudgetRow[] => {
      const cats = categoryMap(user)
      const rows = db.select({ categoryId: budgets.categoryId, amount: budgets.amount }).from(budgets)
        .where(and(eq(budgets.user, user), eq(budgets.year, year), eq(budgets.month, month))).all()
      const result: BudgetRow[] = []
      for (const r of rows) {
        const cat = cats.get(r.categoryId)
        if (!cat) continue
        result.push({ categoryId: r.categoryId, name: cat.name, amount: r.amount })
      }
      return result
    }
  }
}
