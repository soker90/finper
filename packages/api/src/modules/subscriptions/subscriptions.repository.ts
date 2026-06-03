import { eq, and, asc, desc, isNull, inArray, gte, lte } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
const { subscriptions, transactions, categories, accounts, stores, subscriptionCandidates } = schema

type Subscription = typeof subscriptions.$inferSelect
type CandidateRow = typeof subscriptionCandidates.$inferSelect

export interface SubscriptionTransactionRow {
  id: string
  date: number
  amount: number
  type: string
  note: string | null
  tags: string[]
  subscriptionId: string | null
  categoryId: string
  categoryName: string | null
  accountId: string
  accountName: string | null
  accountBank: string | null
  storeId: string | null
  storeName: string | null
}

export interface SubscriptionRow extends Subscription {
  categoryName: string | null
  accountName: string | null
  accountBank: string | null
}

const selectWithJoins = (db: DB) => db.select({
  id: subscriptions.id,
  name: subscriptions.name,
  amount: subscriptions.amount,
  currency: subscriptions.currency,
  cycle: subscriptions.cycle,
  nextPaymentDate: subscriptions.nextPaymentDate,
  categoryId: subscriptions.categoryId,
  accountId: subscriptions.accountId,
  logoUrl: subscriptions.logoUrl,
  user: subscriptions.user,
  categoryName: categories.name,
  accountName: accounts.name,
  accountBank: accounts.bank
})
  .from(subscriptions)
  .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
  .leftJoin(accounts, eq(subscriptions.accountId, accounts.id))

const transactionsSelect = (db: DB) => db.select({
  id: transactions.id,
  date: transactions.date,
  amount: transactions.amount,
  type: transactions.type,
  note: transactions.note,
  tags: transactions.tags,
  subscriptionId: transactions.subscriptionId,
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

export const createSubscriptionsRepository = (db: DB) => ({
  findByUser: (user: string): SubscriptionRow[] =>
    selectWithJoins(db).where(eq(subscriptions.user, user)).orderBy(asc(subscriptions.nextPaymentDate)).all() as SubscriptionRow[],

  findByIdPopulated: (id: string, user: string): SubscriptionRow | undefined =>
    selectWithJoins(db).where(and(eq(subscriptions.id, id), eq(subscriptions.user, user))).get() as SubscriptionRow | undefined,

  findByIdAny: (id: string): Subscription | undefined =>
    db.select().from(subscriptions).where(eq(subscriptions.id, id)).get(),

  exists: (id: string, user: string): boolean =>
    Boolean(db.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.user, user))).get()),

  create: (data: { name: string, amount: number, currency?: string | null, cycle: number, categoryId: string, accountId: string, logoUrl?: string | null, user: string }): Subscription => {
    const id = generateId()
    return db.insert(subscriptions).values({ ...data, id, nextPaymentDate: null }).returning().get()
  },

  update: (id: string, user: string, data: Partial<Omit<Subscription, 'id' | 'user'>>): Subscription | undefined =>
    db.update(subscriptions).set(data).where(and(eq(subscriptions.id, id), eq(subscriptions.user, user))).returning().get(),

  updateNextPaymentDate: (id: string, nextPaymentDate: number | null): void => {
    db.update(subscriptions).set({ nextPaymentDate }).where(eq(subscriptions.id, id)).run()
  },

  delete: (id: string, user: string): void => {
    db.delete(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.user, user))).run()
  },

  findLatestTransactionDate: (subscriptionId: string): number | null => {
    const row = db.select({ date: transactions.date })
      .from(transactions)
      .where(eq(transactions.subscriptionId, subscriptionId))
      .orderBy(desc(transactions.date))
      .get()
    return row ? row.date : null
  },

  unlinkAllTransactions: (subscriptionId: string): void => {
    db.update(transactions).set({ subscriptionId: null }).where(eq(transactions.subscriptionId, subscriptionId)).run()
  },

  // --- Parte B ---
  findTransactionsBySubscription: (subscriptionId: string, user: string): SubscriptionTransactionRow[] =>
    transactionsSelect(db)
      .where(and(eq(transactions.subscriptionId, subscriptionId), eq(transactions.user, user)))
      .orderBy(desc(transactions.date))
      .all() as SubscriptionTransactionRow[],

  findMatchingTransactions: (categoryId: string, accountId: string, user: string): SubscriptionTransactionRow[] =>
    transactionsSelect(db)
      .where(and(
        eq(transactions.user, user),
        eq(transactions.categoryId, categoryId),
        eq(transactions.accountId, accountId),
        isNull(transactions.subscriptionId)
      ))
      .orderBy(desc(transactions.date))
      .limit(50)
      .all() as SubscriptionTransactionRow[],

  linkTransactions: (subscriptionId: string, transactionIds: string[]): void => {
    db.update(transactions).set({ subscriptionId }).where(inArray(transactions.id, transactionIds)).run()
  },

  unlinkTransaction: (transactionId: string): void => {
    db.update(transactions).set({ subscriptionId: null }).where(eq(transactions.id, transactionId)).run()
  },

  // --- Parte C: candidates ---
  findMatchingSubscriptions: (user: string, accountId: string, categoryId: string, from: number, to: number): Subscription[] =>
    db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.user, user),
        eq(subscriptions.accountId, accountId),
        eq(subscriptions.categoryId, categoryId),
        gte(subscriptions.nextPaymentDate, from),
        lte(subscriptions.nextPaymentDate, to)
      ))
      .all(),

  createCandidate: (data: { transactionId: string, subscriptionIds: string[], user: string }): void => {
    db.insert(subscriptionCandidates).values({
      id: generateId(),
      transactionId: data.transactionId,
      subscriptionIds: data.subscriptionIds,
      user: data.user,
      createdAt: Date.now()
    }).run()
  },

  findCandidatesByUser: (user: string): CandidateRow[] =>
    db.select().from(subscriptionCandidates)
      .where(eq(subscriptionCandidates.user, user))
      .orderBy(desc(subscriptionCandidates.createdAt))
      .all(),

  findCandidateById: (id: string): CandidateRow | undefined =>
    db.select().from(subscriptionCandidates).where(eq(subscriptionCandidates.id, id)).get(),

  deleteCandidate: (id: string): void => {
    db.delete(subscriptionCandidates).where(eq(subscriptionCandidates.id, id)).run()
  },

  findTransactionById: (id: string): SubscriptionTransactionRow | undefined =>
    transactionsSelect(db).where(eq(transactions.id, id)).get() as SubscriptionTransactionRow | undefined,

  findSubscriptionsByIds: (ids: string[]): Array<{ id: string, name: string, logoUrl: string | null, amount: number, cycle: number, nextPaymentDate: number | null }> => {
    if (ids.length === 0) return []
    return db.select({
      id: subscriptions.id,
      name: subscriptions.name,
      logoUrl: subscriptions.logoUrl,
      amount: subscriptions.amount,
      cycle: subscriptions.cycle,
      nextPaymentDate: subscriptions.nextPaymentDate
    }).from(subscriptions).where(inArray(subscriptions.id, ids)).all()
  }
})
