import { TransactionType } from 'types/transaction'

export const AMOUNT_COLORS = {
  [TransactionType.Income]: 'success.main',
  [TransactionType.Expense]: 'error.main',
  [TransactionType.NotComputable]: 'secondary.main'
}

export const TRANSACTION_SYMBOL = {
  [TransactionType.Expense]: '-',
  [TransactionType.Income]: '+',
  [TransactionType.NotComputable]: ''
}
