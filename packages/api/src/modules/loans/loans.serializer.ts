import type { LoanRow } from './loans.repository'

// Forma de salida 1:1 con el modelo viejo: _id, account/category como ids planos.
export const serializeLoan = (row: LoanRow) => ({
  _id: row.id,
  name: row.name,
  initialAmount: row.initialAmount,
  pendingAmount: row.pendingAmount,
  interestRate: row.interestRate,
  startDate: row.startDate,
  monthlyPayment: row.monthlyPayment,
  initialEstimatedCost: row.initialEstimatedCost,
  account: row.accountId,
  category: row.categoryId,
  user: row.user
})
