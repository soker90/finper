import { eq, and, gte, lt, lte, inArray } from 'drizzle-orm'
import { type DB, schema } from '@soker90/finper-db'
import { chunk } from '../../utils'

const { transactions, transactionSplits, categories } = schema

export interface EffectiveCategoryRow {
  transactionId: string
  date: number
  categoryId: string
  categoryName?: string | null
  amount: number
  type: string
  storeId?: string | null
  tags?: string[]
  note?: string | null
  /** Id of the split line this row comes from, when the parent transaction is
   * divided. Undefined for non-split (parent) rows. Lets consumers that
   * expand transactions into per-line rows (e.g. stats tag detail) tell
   * apart two lines of the same transaction instead of colliding on
   * `transactionId`. */
  splitId?: string
}

export interface EffectiveCategoryQuery {
  user: string
  from?: number
  to?: number
  toInclusive?: boolean
  type?: string
}

export interface SplitRow {
  id: string
  categoryId: string
  amount: number
  tags: string[]
  categoryName: string | null
}

// SQLite caps the number of bound parameters per statement (32766 on modern
// builds, 999 on older ones). A user with many expenses could exceed that if
// all their transaction ids were passed to a single `IN (...)`, so the ids
// are queried in chunks instead of one unbounded list.
const ID_CHUNK_SIZE = 500

export const loadSplitsByTransactionIds = (db: DB, transactionIds: string[]): Map<string, SplitRow[]> => {
  const grouped = new Map<string, SplitRow[]>()
  if (transactionIds.length === 0) return grouped

  for (const idsChunk of chunk(transactionIds, ID_CHUNK_SIZE)) {
    const rows = db.select({
      id: transactionSplits.id,
      transactionId: transactionSplits.transactionId,
      categoryId: transactionSplits.categoryId,
      amount: transactionSplits.amount,
      tags: transactionSplits.tags,
      categoryName: categories.name
    })
      .from(transactionSplits)
      .leftJoin(categories, eq(transactionSplits.categoryId, categories.id))
      .where(inArray(transactionSplits.transactionId, idsChunk))
      .all()

    for (const row of rows) {
      const list = grouped.get(row.transactionId) ?? []
      list.push({
        id: row.id,
        categoryId: row.categoryId,
        amount: row.amount,
        tags: row.tags ?? [],
        categoryName: row.categoryName
      })
      grouped.set(row.transactionId, list)
    }
  }
  return grouped
}

export const findEffectiveCategoryRows = (db: DB, query: EffectiveCategoryQuery): EffectiveCategoryRow[] => {
  const conditions = [eq(transactions.user, query.user)]
  if (query.from !== undefined) conditions.push(gte(transactions.date, query.from))
  if (query.to !== undefined) {
    conditions.push(query.toInclusive ? lte(transactions.date, query.to) : lt(transactions.date, query.to))
  }
  if (query.type) conditions.push(eq(transactions.type, query.type))

  const parents = db.select({
    id: transactions.id,
    date: transactions.date,
    categoryId: transactions.categoryId,
    categoryName: categories.name,
    amount: transactions.amount,
    type: transactions.type,
    storeId: transactions.storeId,
    tags: transactions.tags,
    note: transactions.note
  }).from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions)).all()

  const splitsByTransaction = loadSplitsByTransactionIds(db, parents.map(parent => parent.id))
  const rows: EffectiveCategoryRow[] = []

  for (const parent of parents) {
    const splits = splitsByTransaction.get(parent.id)
    if (splits && splits.length >= 2) {
      for (const split of splits) {
        rows.push({
          transactionId: parent.id,
          date: parent.date,
          categoryId: split.categoryId,
          categoryName: split.categoryName,
          amount: split.amount,
          type: parent.type,
          storeId: parent.storeId,
          tags: split.tags ?? [],
          note: parent.note,
          splitId: split.id
        })
      }
    } else {
      rows.push({
        transactionId: parent.id,
        date: parent.date,
        categoryId: parent.categoryId,
        categoryName: parent.categoryName,
        amount: parent.amount,
        type: parent.type,
        storeId: parent.storeId,
        tags: parent.tags,
        note: parent.note
      })
    }
  }

  return rows
}
