import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { type DB, schema, TRANSACTION } from '@soker90/finper-db'
import { findEffectiveCategoryRows, loadSplitsByTransactionIds } from '../transactions/effective-category-rows'

const { transactions, categories, accounts, stores } = schema

export interface ExpenseRow {
  id: string
  date: number
  amount: number
  tags: string[]
  categoryId: string
  categoryName: string | null
}

export interface ExpenseDetailRow extends ExpenseRow {
  type: string
  note: string | null
  accountId: string
  accountName: string | null
  accountBank: string | null
  storeId: string | null
  storeName: string | null
}

export const createStatsRepository = (db: DB) => ({
  findExpenses: (user: string, range?: { from: number, to: number }): ExpenseRow[] => {
    const rows = findEffectiveCategoryRows(db, {
      user,
      type: TRANSACTION.Expense,
      from: range?.from,
      to: range?.to,
      toInclusive: true
    })
    return rows.map(row => ({
      id: row.transactionId,
      date: row.date,
      amount: row.amount,
      tags: row.tags ?? [],
      categoryId: row.categoryId,
      categoryName: row.categoryName ?? null
    }))
  },

  findExpenseDetails: (user: string, from: number, to: number): ExpenseDetailRow[] => {
    const parents = db.select({
      id: transactions.id,
      date: transactions.date,
      amount: transactions.amount,
      tags: transactions.tags,
      type: transactions.type,
      note: transactions.note,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      accountId: transactions.accountId,
      accountName: accounts.name,
      accountBank: accounts.bank,
      storeId: transactions.storeId,
      storeName: stores.name
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(stores, eq(transactions.storeId, stores.id))
      .where(and(
        eq(transactions.user, user),
        eq(transactions.type, TRANSACTION.Expense),
        gte(transactions.date, from),
        lte(transactions.date, to)
      ))
      .orderBy(desc(transactions.date))
      .all() as ExpenseDetailRow[]

    const splitsByTransaction = loadSplitsByTransactionIds(db, parents.map(parent => parent.id))
    const rows: ExpenseDetailRow[] = []

    for (const parent of parents) {
      const splits = splitsByTransaction.get(parent.id)
      if (splits && splits.length > 0) {
        for (const split of splits) {
          rows.push({
            ...parent,
            amount: split.amount,
            categoryId: split.categoryId,
            categoryName: split.categoryName,
            tags: split.tags ?? []
          })
        }
      } else {
        rows.push(parent)
      }
    }

    return rows
  }
})
