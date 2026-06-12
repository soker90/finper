import type { TransactionType } from '@soker90/finper-types'

export const AMOUNT_COLORS: Record<TransactionType, string> = {
  income: 'success',
  expense: 'error',
  not_computable: 'secondary'
}

export const TRANSACTION_SYMBOL: Record<TransactionType, string> = {
  expense: '-',
  income: '+',
  not_computable: ''
}
