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

// Pago serializado (1:1 con leanDoc del viejo: _id, loan como id plano).
export const serializePayment = (row: import('./loans.repository').LoanPaymentRow) => ({
  _id: row.id,
  loan: row.loanId,
  date: row.date,
  amount: row.amount,
  interest: row.interest,
  principal: row.principal,
  accumulatedPrincipal: row.accumulatedPrincipal,
  pendingCapital: row.pendingCapital,
  type: row.type,
  user: row.user
})

// Evento serializado (1:1 con leanDoc del viejo: _id, loan como id plano).
export const serializeEvent = (row: import('./loans.repository').LoanEventRow) => ({
  _id: row.id,
  loan: row.loanId,
  date: row.date,
  newRate: row.newRate,
  newPayment: row.newPayment,
  user: row.user
})
