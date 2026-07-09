import { eq, and, desc, isNull, inArray, count } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'

const { yields, yieldSettlements, transactions, categories, accounts } = schema

type Yield = typeof yields.$inferSelect
type YieldSettlement = typeof yieldSettlements.$inferSelect

export interface YieldTransactionRow {
  id: string
  date: number
  amount: number
  type: string
  note: string | null
  yieldId: string | null
  yieldSettlementId: string | null
  categoryId: string
  categoryName: string | null
  accountId: string
  accountName: string | null
  accountBank: string | null
}

export interface YieldRow extends Omit<Yield, 'categoryIds'> {
  categoryIds: string[]
  accountName: string | null
  accountBank: string | null
}

const selectWithJoins = (db: DB) => db.select({
  id: yields.id,
  name: yields.name,
  type: yields.type,
  accountId: yields.accountId,
  categoryIds: yields.categoryIds,
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
  yieldSettlementId: transactions.yieldSettlementId,
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

  create: (data: { name: string, type: string, accountId: string, categoryIds: string[], user: string }): Yield => {
    const id = generateId()
    return db.insert(yields).values({ ...data, id }).returning().get()
  },

  update: (id: string, user: string, data: Partial<Omit<Yield, 'id' | 'user'>>): Yield | undefined =>
    db.update(yields).set(data).where(and(eq(yields.id, id), eq(yields.user, user))).returning().get(),

  delete: (id: string, user: string): void => {
    db.delete(yields).where(and(eq(yields.id, id), eq(yields.user, user))).run()
  },

  unlinkAllTransactions: (yieldId: string): void => {
    db.update(transactions)
      .set({ yieldId: null, yieldSettlementId: null })
      .where(eq(transactions.yieldId, yieldId))
      .run()
  },

  findTransactionsByYield: (yieldId: string, user: string): YieldTransactionRow[] =>
    transactionsSelect(db)
      .where(and(eq(transactions.yieldId, yieldId), eq(transactions.user, user)))
      .orderBy(desc(transactions.date))
      .all() as YieldTransactionRow[],

  findMatchingTransactions: ({ accountId, categoryIds, user }: { accountId: string, categoryIds: string[], user: string }): YieldTransactionRow[] =>
    transactionsSelect(db)
      .where(and(
        eq(transactions.user, user),
        eq(transactions.accountId, accountId),
        inArray(transactions.categoryId, categoryIds),
        isNull(transactions.yieldId)
      ))
      .orderBy(desc(transactions.date))
      .limit(50)
      .all() as YieldTransactionRow[],

  linkTransactions: (yieldId: string, yieldSettlementId: string, transactionIds: string[], user: string): void => {
    db.update(transactions)
      .set({ yieldId, yieldSettlementId })
      .where(and(inArray(transactions.id, transactionIds), eq(transactions.user, user)))
      .run()
  },

  unlinkTransaction: (transactionId: string, user: string): void => {
    db.update(transactions)
      .set({ yieldId: null, yieldSettlementId: null })
      .where(and(eq(transactions.id, transactionId), eq(transactions.user, user)))
      .run()
  },

  findTransactionSettlementId: (transactionId: string, user: string): string | null => {
    const row = db.select({ yieldSettlementId: transactions.yieldSettlementId }).from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.user, user))).get()
    return row?.yieldSettlementId ?? null
  },

  // Settlements CRUD
  findSettlementsByYieldId: (yieldId: string, user: string): YieldSettlement[] =>
    db.select().from(yieldSettlements)
      .where(and(eq(yieldSettlements.yieldId, yieldId), eq(yieldSettlements.user, user))).all(),

  findSettlementById: (id: string, user: string): YieldSettlement | undefined =>
    db.select().from(yieldSettlements)
      .where(and(eq(yieldSettlements.id, id), eq(yieldSettlements.user, user))).get() as YieldSettlement | undefined,

  createSettlement: (data: { yieldId: string, user: string, tae?: number | null, averageBalance?: number | null }): YieldSettlement => {
    const id = generateId()
    return db.insert(yieldSettlements).values({ ...data, id }).returning().get()
  },

  updateSettlement: (id: string, user: string, data: { tae?: number | null, averageBalance?: number | null }): YieldSettlement | undefined =>
    db.update(yieldSettlements).set(data)
      .where(and(eq(yieldSettlements.id, id), eq(yieldSettlements.user, user)))
      .returning().get() as YieldSettlement | undefined,

  deleteSettlement: (id: string, user: string): void => {
    db.delete(yieldSettlements).where(and(eq(yieldSettlements.id, id), eq(yieldSettlements.user, user))).run()
  },

  deleteSettlementsByYield: (yieldId: string): void => {
    db.delete(yieldSettlements).where(eq(yieldSettlements.yieldId, yieldId)).run()
  },

  isSettlementEmpty: (settlementId: string): boolean => {
    const row = db.select({ val: count() }).from(transactions).where(eq(transactions.yieldSettlementId, settlementId)).get()
    return (row?.val ?? 0) === 0
  }
})
