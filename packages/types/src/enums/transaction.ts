export const TRANSACTION = {
  Expense: 'expense',
  Income: 'income',
  NotComputable: 'not_computable',
} as const

export type TransactionType = typeof TRANSACTION[keyof typeof TRANSACTION]
