import { schema } from '@soker90/finper-db'
import type { TransactionRow } from './transactions.repository'
import type { SplitRow } from './effective-category-rows'

type Transaction = typeof schema.transactions.$inferSelect

const serializeSplitPlain = (split: SplitRow) => {
  const result: Record<string, any> = {
    _id: split.id,
    category: split.categoryId,
    amount: split.amount,
    tags: split.tags ?? []
  }
  return result
}

const serializeSplitPopulated = (split: SplitRow) => {
  const result: Record<string, any> = {
    _id: split.id,
    category: { _id: split.categoryId, name: split.categoryName },
    amount: split.amount,
    tags: split.tags ?? []
  }
  return result
}

export const serializeTransaction = (transaction: Transaction, splits?: SplitRow[]) => {
  const result: Record<string, any> = {
    _id: transaction.id,
    date: transaction.date,
    category: transaction.categoryId,
    amount: transaction.amount,
    type: transaction.type,
    account: transaction.accountId,
    tags: transaction.tags ?? []
  }
  if (transaction.note !== null && transaction.note !== undefined) result.note = transaction.note
  if (transaction.storeId) result.store = transaction.storeId
  if (transaction.subscriptionId) result.subscriptionId = transaction.subscriptionId
  if (splits && splits.length >= 2) result.splits = splits.map(serializeSplitPlain)
  return result
}

export const serializeTransactionPopulated = (row: TransactionRow, splits?: SplitRow[]) => {
  const result: Record<string, any> = {
    _id: row.id,
    date: row.date,
    category: { _id: row.categoryId, name: row.categoryName },
    amount: row.amount,
    type: row.type,
    account: { _id: row.accountId, name: row.accountName, bank: row.accountBank },
    tags: row.tags ?? []
  }
  if (row.note !== null && row.note !== undefined) result.note = row.note
  if (row.storeId) result.store = { _id: row.storeId, name: row.storeName }
  if (row.subscriptionId) result.subscriptionId = row.subscriptionId
  if (row.creditCardId) result.creditCard = { id: row.creditCardId, name: row.creditCardName }
  if (splits && splits.length >= 2) result.splits = splits.map(serializeSplitPopulated)
  return result
}
