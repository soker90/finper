import type { TransactionType } from 'types'

export const AMOUNT_COLORS: Record<TransactionType, string> = {
  income: 'success.main',
  expense: 'error.main',
  not_computable: 'secondary.main'
}

export const TRANSACTION_SYMBOL: Record<TransactionType, string> = {
  expense: '-',
  income: '+',
  not_computable: ''
}
