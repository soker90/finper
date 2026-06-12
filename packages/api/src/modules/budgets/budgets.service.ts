import { TRANSACTION } from '@soker90/finper-db'
import { serializeBudget } from './budgets.serializer'
import { calcBudgetByMonths } from './utils/calcBudgetByMonths'

type IBudgetsRepository = ReturnType<typeof import('./budgets.repository').createBudgetsRepository>

// Mes (1-12) de un timestamp en zona Europe/Madrid (1:1 con el $month timezone del viejo).
const monthInMadrid = (date: number): number =>
  Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', month: 'numeric' }).format(new Date(date)))

export class BudgetsService {
  constructor (private repository: IBudgetsRepository) {}

  // Suma de transacciones por { month (Madrid), category }. Forma 1:1 con la agregación vieja.
  getTransactionsSumByMonth ({ user, year, month }: { user: string, year: number, month: number }) {
    const from = new Date(year, month || 0, 1).getTime()
    const to = new Date(Number(isNaN(month) ? year + 1 : year), Number(isNaN(month) ? 0 : month + 1), 1).getTime()

    const grouped = new Map<string, { month: number, category: string, total: number }>()
    for (const tx of this.repository.findTransactionsInRange(user, from, to)) {
      const m = monthInMadrid(tx.date)
      const key = `${m}:${tx.categoryId}`
      const entry = grouped.get(key)
      if (entry) entry.total += tx.amount
      else grouped.set(key, { month: m, category: tx.categoryId, total: tx.amount })
    }

    return [...grouped.values()]
      .sort((a, b) => a.month - b.month)
      .map(g => ({ _id: { month: g.month, category: g.category }, total: g.total }))
  }

  // Categorías hijas con su budgetRuleClass (propio o heredado del padre) y sus budgets.
  getCategoriesWithBudgets ({ user, year, month }: { user: string, year: number, month: number }) {
    const categories = this.repository.findChildCategories(user)
    const budgetsList = this.repository.findBudgets(user, year, month)

    return categories.map(category => {
      const ruleClass = category.budgetRuleClass !== 'none'
        ? category.budgetRuleClass
        : (category.parentBudgetRuleClass ?? 'none')

      const budgets = budgetsList
        .filter(b => b.categoryId === category.id)
        .map(b => ({ month: b.month, amount: b.amount, year: b.year }))

      return { _id: category.id, name: category.name, type: category.type, budgetRuleClass: ruleClass, budgets }
    })
  }

  // Upsert por (category, year, month, user).
  editBudget ({ category, year, month, user, amount }: { category: string, year: number, month: number, user: string, amount: number }) {
    const existing = this.repository.findBudget(category, year, month, user)
    const row = existing
      ? this.repository.updateBudgetAmount(existing.id, amount)
      : this.repository.insertBudget({ categoryId: category, year, month, amount, user })
    return serializeBudget(row)
  }

  // Copia los budgets de (monthOrigin, yearOrigin) a (month, year). false si no hay origen.
  copy ({ monthOrigin, yearOrigin, month, year, user }: { monthOrigin: number, yearOrigin: number, month: number, year: number, user: string }): boolean {
    const origin = this.repository.findBudgetsForCopy(user, monthOrigin, yearOrigin)
    if (origin.length === 0) return false

    for (const b of origin) {
      const existing = this.repository.findBudget(b.categoryId, year, month, user)
      if (existing) this.repository.updateBudgetAmount(existing.id, b.amount)
      else this.repository.insertBudget({ categoryId: b.categoryId, year, month, amount: b.amount, user })
    }
    return true
  }

  // --- Parte B: getBudgets (orquestación + regla 50/30/20) ---

  getBudgets ({ user, year, month }: { user: string, year: number, month: number }) {
    const transactionsSum = this.getTransactionsSumByMonth({ user, year, month })
    const categoriesWithBudgets = this.getCategoriesWithBudgets({ user, year, month })

    const expenses = this.getBudgetsByType({ filterType: TRANSACTION.Expense, categoriesWithBudgets, transactionsSum, month })
    const incomes = this.getBudgetsByType({ filterType: TRANSACTION.Income, categoriesWithBudgets, transactionsSum, month })
    const rule503020 = this.calculateRule503020({ expenses, incomes })

    return { expenses, incomes, rule503020 }
  }

  private getBudgetsByType ({
    filterType, categoriesWithBudgets, transactionsSum, month
  }: { filterType: string, categoriesWithBudgets: any[], transactionsSum: any, month?: number }): any {
    const categoriesByType = categoriesWithBudgets.filter(({ type }) => type === filterType).map(category => calcBudgetByMonths({
      category, transactionsSum, month
    }))

    const getRealValue = (item: any) => isNaN(month as number) ? (item.total ?? 0) : (item.budgets?.[0]?.real ?? 0)
    categoriesByType.sort((a, b) => getRealValue(b) - getRealValue(a))

    if (categoriesByType.length > 0) {
      categoriesByType.push(this.getTotalsByMonth(categoriesByType))
    }

    return categoriesByType
  }

  private getTotalsByMonth (categories: any[]): { name: string, id: string, budgets: { amount: number, real: number, month?: number, year?: number }[] } {
    const totals: {
      name: string, id: string, budgets: { amount: number, real: number }[], total: number
    } = { name: 'Totales', id: 'totals', budgets: [], total: 0 }

    let totalYear = 0

    categories.forEach(({ budgets }) => {
      if (totals.budgets.length > 0) {
        budgets.forEach((budget: { amount: number, real: number }, index: number) => {
          totals.budgets[index].amount += budget.amount
          totals.budgets[index].real += budget.real
          totalYear += budget.real
        })
      } else {
        budgets.forEach((budget: { amount: number, real: number }) => {
          totals.budgets.push({ amount: budget.amount, real: budget.real })
          totalYear += budget.real
        })
      }
    })

    totals.total = totalYear

    return totals
  }

  private calculateRule503020 ({ expenses, incomes }: { expenses: any[], incomes: any[] }) {
    const activeExpenses = expenses.filter(category => category.id !== 'totals')
    const activeIncomes = incomes.filter(category => category.id !== 'totals')

    const sumCategoryBudgets = (categories: any[], key: 'amount' | 'real'): number => {
      let total = 0
      categories.forEach(category => {
        category.budgets.forEach((budget: any) => {
          total += (budget[key] ?? 0)
        })
      })
      return Math.round(total * 100) / 100
    }

    const incomeBudgeted = sumCategoryBudgets(activeIncomes, 'amount')
    const incomeReal = sumCategoryBudgets(activeIncomes, 'real')

    const needsBudgeted = sumCategoryBudgets(activeExpenses.filter(c => c.budgetRuleClass === 'needs'), 'amount')
    const needsReal = sumCategoryBudgets(activeExpenses.filter(c => c.budgetRuleClass === 'needs'), 'real')

    const wantsBudgeted = sumCategoryBudgets(activeExpenses.filter(c => c.budgetRuleClass === 'wants'), 'amount')
    const wantsReal = sumCategoryBudgets(activeExpenses.filter(c => c.budgetRuleClass === 'wants'), 'real')

    const savingsBudgeted = Math.round((incomeBudgeted - (needsBudgeted + wantsBudgeted)) * 100) / 100
    const savingsReal = Math.round((incomeReal - (needsReal + wantsReal)) * 100) / 100

    const getPercentage = (value: number, total: number): number => {
      if (total <= 0) return 0
      return Math.round((value / total) * 10000) / 100
    }

    return {
      needs: {
        budgeted: needsBudgeted,
        real: needsReal,
        percentageBudgeted: getPercentage(needsBudgeted, incomeBudgeted),
        percentageReal: getPercentage(needsReal, incomeReal)
      },
      wants: {
        budgeted: wantsBudgeted,
        real: wantsReal,
        percentageBudgeted: getPercentage(wantsBudgeted, incomeBudgeted),
        percentageReal: getPercentage(wantsReal, incomeReal)
      },
      savings: {
        budgeted: savingsBudgeted,
        real: savingsReal,
        percentageBudgeted: getPercentage(savingsBudgeted, incomeBudgeted),
        percentageReal: getPercentage(savingsReal, incomeReal)
      },
      totals: { incomeBudgeted, incomeReal }
    }
  }
}
