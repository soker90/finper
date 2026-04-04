import { TransactionType } from '@soker90/finper-shared'
import { ITransaction } from '@soker90/finper-models'

export const getTransactionAmount = (transaction: ITransaction): number =>
  transaction.type === TransactionType.Expense
    ? -transaction.amount
    : transaction.type === TransactionType.Income
      ? transaction.amount
      : 0
