import { TRANSACTION } from 'types'

export const AMOUNT_COLORS = {
  [TRANSACTION.Income]: 'success.main',
  [TRANSACTION.Expense]: 'error.main',
  [TRANSACTION.NotComputable]: 'secondary.main'
}

export const TRANSACTION_SYMBOL = {
  [TRANSACTION.Expense]: '-',
  [TRANSACTION.Income]: '+',
  [TRANSACTION.NotComputable]: ''
}
