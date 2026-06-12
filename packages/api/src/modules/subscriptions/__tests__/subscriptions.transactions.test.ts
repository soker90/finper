import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createSubscriptionsRepository } from '../subscriptions.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { subscriptions, transactions, categories, accounts, users } = schema

describe('Subscriptions Part B (transactions interaction)', () => {
  let db: DB
  let repository: ReturnType<typeof createSubscriptionsRepository>
  let user: string
  let categoryId: string
  let accountId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createSubscriptionsRepository(db)
    user = generateUsername()
    db.insert(users).values({ id: 'sub-b-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Streaming', type: 'expense', user }).run()
    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user }).run()
  })

  afterAll(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(subscriptions).where(eq(subscriptions.user, user)).run()
    db.delete(categories).where(eq(categories.user, user)).run()
    db.delete(accounts).where(eq(accounts.user, user)).run()
    db.delete(users).where(eq(users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(subscriptions).where(eq(subscriptions.user, user)).run()
  })

  const insertTx = (overrides: Record<string, any> = {}) => {
    const id = generateId()
    db.insert(transactions).values({
      id,
      date: overrides.date ?? 1000,
      categoryId: overrides.categoryId ?? categoryId,
      amount: overrides.amount ?? 9.99,
      type: overrides.type ?? 'expense',
      accountId: overrides.accountId ?? accountId,
      note: overrides.note ?? null,
      storeId: overrides.storeId ?? null,
      subscriptionId: overrides.subscriptionId ?? null,
      tags: overrides.tags ?? [],
      user
    }).run()
    return id
  }

  // Unit: requires 50+ transactions, not reasonable to reproduce over HTTP.
  describe('repository.findMatchingTransactions', () => {
    it('caps results at 50', () => {
      for (let i = 0; i < 55; i++) insertTx({ subscriptionId: null, date: i })
      expect(repository.findMatchingTransactions(categoryId, accountId, user)).toHaveLength(50)
    })
  })
})
