import type { BudgetRow } from './budgets.repository'

// 1:1 con el modelo viejo: _id, category como id plano.
export const serializeBudget = (row: BudgetRow) => ({
  _id: row.id,
  year: row.year,
  month: row.month,
  category: row.categoryId,
  amount: row.amount,
  user: row.user
})
