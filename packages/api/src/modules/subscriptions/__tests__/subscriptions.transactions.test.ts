import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createSubscriptionsRepository } from '../subscriptions.repository'
import { SubscriptionsService, advanceDate } from '../subscriptions.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { subscriptions, transactions, categories, accounts, users } = schema

describe('Subscriptions Part B (transactions interaction)', () => {
  let db: DB
  let repository: ReturnType<typeof createSubscriptionsRepository>
  let service: SubscriptionsService
  let user: string
  let categoryId: string
  let accountId: string
  let otherCategoryId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createSubscriptionsRepository(db)
    service = new SubscriptionsService(repository)
    user = generateUsername()
    db.insert(users).values({ id: 'sub-b-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Streaming', type: 'expense', user }).run()
    otherCategoryId = generateId()
    db.insert(categories).values({ id: otherCategoryId, name: 'Other', type: 'expense', user }).run()
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

  const makeSub = (cycle = 1) => repository.create({ name: 'Netflix', amount: 9.99, cycle, categoryId, accountId, user })

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

  describe('repository.findTransactionsBySubscription', () => {
    it('returns only linked transactions, populated, ordered date desc', () => {
      const sub = makeSub()
      insertTx({ subscriptionId: sub.id, date: 100 })
      insertTx({ subscriptionId: sub.id, date: 300 })
      insertTx({ subscriptionId: null })

      const rows = repository.findTransactionsBySubscription(sub.id, user)
      expect(rows).toHaveLength(2)
      expect(rows.map(r => r.date)).toEqual([300, 100])
      expect(rows[0].categoryName).toBe('Streaming')
      expect(rows[0].accountBank).toBe('BankA')
    })
  })

  describe('repository.findMatchingTransactions', () => {
    it('returns unlinked transactions matching category+account', () => {
      const otherSub = makeSub() // subscription real para vincular (FK válida)
      insertTx({ subscriptionId: null })
      insertTx({ subscriptionId: otherSub.id }) // vinculada a otra subscription, excluida
      insertTx({ categoryId: otherCategoryId }) // otra category, excluida

      const rows = repository.findMatchingTransactions(categoryId, accountId, user)
      expect(rows).toHaveLength(1)
      expect(rows[0].subscriptionId).toBeNull()
    })

    it('caps results at 50', () => {
      for (let i = 0; i < 55; i++) insertTx({ subscriptionId: null, date: i })
      expect(repository.findMatchingTransactions(categoryId, accountId, user)).toHaveLength(50)
    })
  })

  describe('repository.linkTransactions / unlinkTransaction', () => {
    it('links several transactions and unlinks one', () => {
      const sub = makeSub()
      const t1 = insertTx({ subscriptionId: null })
      const t2 = insertTx({ subscriptionId: null })

      repository.linkTransactions(sub.id, [t1, t2])
      expect(db.select().from(transactions).where(eq(transactions.subscriptionId, sub.id)).all()).toHaveLength(2)

      repository.unlinkTransaction(t1)
      expect(db.select().from(transactions).where(eq(transactions.subscriptionId, sub.id)).all()).toHaveLength(1)
    })
  })

  describe('service.getTransactionsBySubscription', () => {
    it('serializes populated transactions', () => {
      const sub = makeSub()
      insertTx({ subscriptionId: sub.id, date: 100, note: 'hi' })
      const [tx] = service.getTransactionsBySubscription(sub.id, user)
      expect(tx.category).toEqual({ _id: categoryId, name: 'Streaming' })
      expect(tx.account).toEqual({ _id: accountId, name: 'Checking', bank: 'BankA' })
      expect(tx.note).toBe('hi')
      expect(tx.subscriptionId).toBe(sub.id)
    })
  })

  describe('service.getMatchingTransactions', () => {
    it('returns [] when subscription does not exist', () => {
      expect(service.getMatchingTransactions('62a39498c4497e1fe3c2bf35', user)).toEqual([])
    })

    it('returns matching transactions without subscriptionId field', () => {
      const sub = makeSub()
      insertTx({ subscriptionId: null })
      const result = service.getMatchingTransactions(sub.id, user)
      expect(result.length).toBeGreaterThanOrEqual(1)
      result.forEach((tx: any) => expect(tx.subscriptionId).toBeUndefined())
    })
  })

  describe('service.linkTransactions / unlinkTransaction (recalculates)', () => {
    it('links and recalculates nextPaymentDate from the last linked tx', () => {
      const sub = makeSub(1)
      const lastDate = new Date(2025, 0, 15).getTime()
      const t1 = insertTx({ subscriptionId: null, date: lastDate })

      service.linkTransactions(sub.id, [t1])
      expect(repository.findByIdAny(sub.id)?.nextPaymentDate).toBe(advanceDate(lastDate, 1))
    })

    it('unlinks and recalculates back to null when no tx remain', () => {
      const sub = makeSub(1)
      const t1 = insertTx({ subscriptionId: sub.id, date: 1000 })
      repository.updateNextPaymentDate(sub.id, 9999)

      service.unlinkTransaction(sub.id, t1)
      expect(repository.findByIdAny(sub.id)?.nextPaymentDate).toBeNull()
    })
  })
})
