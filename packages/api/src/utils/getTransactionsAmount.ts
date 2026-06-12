import { TRANSACTION } from '@soker90/finper-db'
import type { TransactionType } from '@soker90/finper-types'

export const getTransactionAmount = (transaction: { type: TransactionType, amount: number }): number =>
  transaction.type === TRANSACTION.Expense
    ? -transaction.amount
    : transaction.type === TRANSACTION.Income
      ? transaction.amount
      : 0
