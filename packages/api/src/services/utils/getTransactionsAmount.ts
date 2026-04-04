import { ITransaction, TransactionType, TransactionDocument } from '@soker90/finper-models'

export const getTransactionAmount = (transaction: ITransaction | TransactionDocument): number =>
  transaction.type === TransactionType.Expense
    ? -transaction.amount
    : transaction.type === TransactionType.Income
      ? transaction.amount
      : 0
