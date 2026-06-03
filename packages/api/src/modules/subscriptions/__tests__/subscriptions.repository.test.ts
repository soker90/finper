import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createSubscriptionsRepository } from '../subscriptions.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { subscriptions, transactions, categories, accounts, users } = schema

describe('Subscriptions Repository', () => {
  let db: DB
  let repository: ReturnType<typeof createSubscriptionsRepository>
  let user: string
  let categoryId: string
  let accountId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createSubscriptionsRepository(db)
    user = generateUsername()
    db.insert(users).values({ id: 'sub-repo-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
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

  const baseData = (overrides: Record<string, any> = {}) => ({
    name: overrides.name ?? 'Netflix',
    amount: overrides.amount ?? 9.99,
    cycle: overrides.cycle ?? 1,
    categoryId,
    accountId,
    user,
    ...overrides
  })

  const insertTx = (subscriptionId: string | null, date: number) => {
    db.insert(transactions).values({
      id: generateId(), date, categoryId, amount: 10, type: 'expense',
      accountId, note: null, storeId: null, subscriptionId, tags: [], user
    }).run()
  }

  it('should create a subscription with nextPaymentDate null', () => {
    const sub = repository.create(baseData())
    expect(sub.id).toBeDefined()
    expect(sub.nextPaymentDate).toBeNull()
    expect(sub.name).toBe('Netflix')
  })

  it('findByUser should populate names and order by nextPaymentDate asc (nulls first)', () => {
    db.insert(subscriptions).values({ id: generateId(), name: 'B', amount: 5, cycle: 1, categoryId, accountId, user, nextPaymentDate: 2000 }).run()
    db.insert(subscriptions).values({ id: generateId(), name: 'A', amount: 5, cycle: 1, categoryId, accountId, user, nextPaymentDate: null }).run()
    db.insert(subscriptions).values({ id: generateId(), name: 'C', amount: 5, cycle: 1, categoryId, accountId, user, nextPaymentDate: 1000 }).run()

    const rows = repository.findByUser(user)
    expect(rows.map(r => r.name)).toEqual(['A', 'C', 'B'])
    expect(rows[0].categoryName).toBe('Streaming')
    expect(rows[0].accountName).toBe('Checking')
    expect(rows[0].accountBank).toBe('BankA')
  })

  it('exists should reflect ownership', () => {
    const sub = repository.create(baseData())
    expect(repository.exists(sub.id, user)).toBe(true)
    expect(repository.exists(sub.id, generateUsername())).toBe(false)
  })

  it('update should modify fields', () => {
    const sub = repository.create(baseData())
    const updated = repository.update(sub.id, user, { name: 'HBO', amount: 12 })
    expect(updated?.name).toBe('HBO')
    expect(updated?.amount).toBe(12)
  })

  it('updateNextPaymentDate should persist the value', () => {
    const sub = repository.create(baseData())
    repository.updateNextPaymentDate(sub.id, 5000)
    expect(repository.findByIdAny(sub.id)?.nextPaymentDate).toBe(5000)
  })

  it('delete should remove the subscription', () => {
    const sub = repository.create(baseData())
    repository.delete(sub.id, user)
    expect(repository.findByIdAny(sub.id)).toBeUndefined()
  })

  it('findLatestTransactionDate should return the most recent linked transaction date', () => {
    const sub = repository.create(baseData())
    insertTx(sub.id, 100)
    insertTx(sub.id, 300)
    insertTx(sub.id, 200)
    expect(repository.findLatestTransactionDate(sub.id)).toBe(300)
  })

  it('findLatestTransactionDate should return null when there are no linked transactions', () => {
    const sub = repository.create(baseData())
    expect(repository.findLatestTransactionDate(sub.id)).toBeNull()
  })

  it('unlinkAllTransactions should null out subscriptionId on linked transactions', () => {
    const sub = repository.create(baseData())
    insertTx(sub.id, 100)
    insertTx(sub.id, 200)
    repository.unlinkAllTransactions(sub.id)
    const stillLinked = db.select().from(transactions).where(eq(transactions.subscriptionId, sub.id)).all()
    expect(stillLinked).toHaveLength(0)
  })
})
