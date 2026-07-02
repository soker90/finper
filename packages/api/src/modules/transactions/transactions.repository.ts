import { eq, and, desc, type SQL } from 'drizzle-orm'
import { type DB, schema } from '@soker90/finper-db'
const { transactions, categories, accounts, stores } = schema

type Transaction = typeof transactions.$inferSelect

export interface TransactionFilters {
  user: string
  account?: string
  category?: string
  type?: string
  store?: string
  page?: number
  limit?: number
}

export interface TransactionRow extends Transaction {
  categoryName: string | null
  accountName: string | null
  accountBank: string | null
  storeName: string | null
}

export const createTransactionsRepository = (db: DB) => ({
  findById: (id: string, user: string): Transaction | undefined =>
    db.select().from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.user, user)))
      .get(),

  findMany: ({ user, account, category, type, store, page = 0, limit = 50 }: TransactionFilters): TransactionRow[] => {
    const conditions: SQL[] = [eq(transactions.user, user)]
    if (account) conditions.push(eq(transactions.accountId, account))
    if (category) conditions.push(eq(transactions.categoryId, category))
    if (type) conditions.push(eq(transactions.type, type))
    if (store) conditions.push(eq(transactions.storeId, store))

    return db.select({
      id: transactions.id,
      date: transactions.date,
      categoryId: transactions.categoryId,
      amount: transactions.amount,
      type: transactions.type,
      accountId: transactions.accountId,
      note: transactions.note,
      storeId: transactions.storeId,
      subscriptionId: transactions.subscriptionId,
      tags: transactions.tags,
      user: transactions.user,
      categoryName: categories.name,
      accountName: accounts.name,
      accountBank: accounts.bank,
      storeName: stores.name
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(stores, eq(transactions.storeId, stores.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(page * limit)
      .all() as TransactionRow[]
  }
})
