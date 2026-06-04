import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { type DB, schema } from '@soker90/finper-db'
import { TRANSACTION } from '@soker90/finper-models'

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
    const conditions = [eq(transactions.user, user), eq(transactions.type, TRANSACTION.Expense)]
    if (range) conditions.push(gte(transactions.date, range.from), lte(transactions.date, range.to))
    return db.select({
      id: transactions.id,
      date: transactions.date,
      amount: transactions.amount,
      tags: transactions.tags,
      categoryId: transactions.categoryId,
      categoryName: categories.name
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .all() as ExpenseRow[]
  },

  findExpenseDetails: (user: string, from: number, to: number): ExpenseDetailRow[] =>
    db.select({
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
})
