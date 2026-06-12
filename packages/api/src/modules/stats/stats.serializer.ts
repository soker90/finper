import type { ExpenseDetailRow } from './stats.repository'

export const serializeStatsTransaction = (row: ExpenseDetailRow) => {
  const result: Record<string, any> = {
    _id: row.id,
    date: row.date,
    amount: row.amount,
    type: row.type,
    tags: row.tags,
    category: { _id: row.categoryId, name: row.categoryName },
    account: { _id: row.accountId, name: row.accountName, bank: row.accountBank }
  }
  if (row.note !== null) result.note = row.note
  if (row.storeId !== null) result.store = { _id: row.storeId, name: row.storeName }
  return result
}
