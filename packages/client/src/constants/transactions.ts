import { TRANSACTION } from 'types/transaction'

const TYPES_TRANSACTIONS = {
  [TRANSACTION.Income]: 'Ingreso',
  [TRANSACTION.Expense]: 'Gasto',
  [TRANSACTION.NotComputable]: 'No computable'
}

export const TYPES_TRANSACTIONS_ENTRIES = Object.entries(TYPES_TRANSACTIONS)
