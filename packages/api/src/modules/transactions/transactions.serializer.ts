import { schema } from '@soker90/finper-db'
import type { TransactionRow } from './transactions.repository'

type Transaction = typeof schema.transactions.$inferSelect

// POST/PUT: doc sin populate (ids planos), 1:1 con el viejo.
export const serializeTransaction = (t: Transaction) => {
  const result: Record<string, any> = {
    _id: t.id,
    date: t.date,
    category: t.categoryId,
    amount: t.amount,
    type: t.type,
    account: t.accountId,
    tags: t.tags ?? []
  }
  if (t.note !== null && t.note !== undefined) result.note = t.note
  if (t.storeId) result.store = t.storeId
  if (t.subscriptionId) result.subscriptionId = t.subscriptionId
  return result
}

// GET: con populate (objetos anidados).
export const serializeTransactionPopulated = (row: TransactionRow) => {
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
  return result
}
