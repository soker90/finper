import { TRANSACTION } from '@soker90/finper-db'
import { ITransaction } from '@soker90/finper-models'

export const getTransactionAmount = (transaction: ITransaction): number =>
  transaction.type === TRANSACTION.Expense
    ? -transaction.amount
    : transaction.type === TRANSACTION.Income
      ? transaction.amount
      : 0
