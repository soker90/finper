import { TransactionType } from 'types/transaction'

export const TYPES_TRANSACTIONS = {
  [TransactionType.Income]: 'Ingreso',
  [TransactionType.Expense]: 'Gasto',
  [TransactionType.NotComputable]: 'No computable'
}

export const TYPES_TRANSACTIONS_ENTRIES = Object.entries(TYPES_TRANSACTIONS)
