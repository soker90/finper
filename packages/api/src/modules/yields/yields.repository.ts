import { eq, and, desc, isNull, inArray } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'

const { yields, transactions, categories, accounts } = schema

type Yield = typeof yields.$inferSelect

export interface YieldTransactionRow {
  id: string
  date: number
  amount: number
  type: string
  note: string | null
  yieldId: string | null
  categoryId: string
  categoryName: string | null
  accountId: string
  accountName: string | null
  accountBank: string | null
}

export interface YieldRow extends Yield {
  accountName: string | null
  accountBank: string | null
}

const selectWithJoins = (db: DB) => db.select({
  id: yields.id,
  name: yields.name,
  type: yields.type,
  accountId: yields.accountId,
  user: yields.user,
  accountName: accounts.name,
  accountBank: accounts.bank
})
  .from(yields)
  .leftJoin(accounts, eq(yields.accountId, accounts.id))

const transactionsSelect = (db: DB) => db.select({
  id: transactions.id,
  date: transactions.date,
  amount: transactions.amount,
  type: transactions.type,
  note: transactions.note,
  yieldId: transactions.yieldId,
  categoryId: transactions.categoryId,
  categoryName: categories.name,
  accountId: transactions.accountId,
  accountName: accounts.name,
  accountBank: accounts.bank
})
  .from(transactions)
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .leftJoin(accounts, eq(transactions.accountId, accounts.id))

export const createYieldsRepository = (db: DB) => ({
  findByUser: (user: string): YieldRow[] =>
    selectWithJoins(db).where(eq(yields.user, user)).all() as YieldRow[],

  findByIdPopulated: (id: string, user: string): YieldRow | undefined =>
    selectWithJoins(db).where(and(eq(yields.id, id), eq(yields.user, user))).get() as YieldRow | undefined,

  create: (data: { name: string, type: string, accountId: string, user: string }): Yield => {
    const id = generateId()
    return db.insert(yields).values({ ...data, id }).returning().get()
  },

  update: (id: string, user: string, data: Partial<Omit<Yield, 'id' | 'user'>>): Yield | undefined =>
    db.update(yields).set(data).where(and(eq(yields.id, id), eq(yields.user, user))).returning().get(),

  delete: (id: string, user: string): void => {
    db.delete(yields).where(and(eq(yields.id, id), eq(yields.user, user))).run()
  },

  unlinkAllTransactions: (yieldId: string): void => {
    db.update(transactions).set({ yieldId: null }).where(eq(transactions.yieldId, yieldId)).run()
  },

  findTransactionsByYield: (yieldId: string, user: string): YieldTransactionRow[] =>
    transactionsSelect(db)
      .where(and(eq(transactions.yieldId, yieldId), eq(transactions.user, user)))
      .orderBy(desc(transactions.date))
      .all() as YieldTransactionRow[],

  findMatchingTransactions: (accountId: string, user: string): YieldTransactionRow[] =>
    transactionsSelect(db)
      .where(and(
        eq(transactions.user, user),
        eq(transactions.accountId, accountId),
        isNull(transactions.yieldId)
      ))
      .orderBy(desc(transactions.date))
      .limit(50)
      .all() as YieldTransactionRow[],

  linkTransactions: (yieldId: string, transactionIds: string[], user: string): void => {
    db.update(transactions)
      .set({ yieldId })
      .where(and(inArray(transactions.id, transactionIds), eq(transactions.user, user)))
      .run()
  },

  unlinkTransaction: (transactionId: string, user: string): void => {
    db.update(transactions)
      .set({ yieldId: null })
      .where(and(eq(transactions.id, transactionId), eq(transactions.user, user)))
      .run()
  }
})
