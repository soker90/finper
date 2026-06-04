import { serializeBudget } from './budgets.serializer'

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
}
