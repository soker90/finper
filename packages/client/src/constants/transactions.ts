import type { TransactionType } from '@soker90/finper-types'

const TYPES_TRANSACTIONS: Record<TransactionType, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  not_computable: 'No computable'
}

export const TYPES_TRANSACTIONS_ENTRIES = Object.entries(TYPES_TRANSACTIONS)

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
