import { TRANSACTION } from 'types'
import type { TransactionType } from 'types'

export const AMOUNT_COLORS: Record<TransactionType, string> = {
  [TRANSACTION.Income]: 'success.main',
  [TRANSACTION.Expense]: 'error.main',
  [TRANSACTION.NotComputable]: 'secondary.main'
}

export const TRANSACTION_SYMBOL: Record<TransactionType, string> = {
  [TRANSACTION.Expense]: '-',
  [TRANSACTION.Income]: '+',
  [TRANSACTION.NotComputable]: ''
}
