import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createSubscriptionsRepository } from '../subscriptions.repository'
import { SubscriptionsService, advanceDate } from '../subscriptions.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { subscriptions, transactions, categories, accounts, users } = schema

describe('Subscriptions Service', () => {
  let db: DB
  let repository: ReturnType<typeof createSubscriptionsRepository>
  let service: SubscriptionsService
  let user: string
  let categoryId: string
  let accountId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createSubscriptionsRepository(db)
    service = new SubscriptionsService(repository)
    user = generateUsername()
    db.insert(users).values({ id: 'sub-svc-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
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

  const params = (overrides: Record<string, any> = {}) => ({
    name: 'Netflix', amount: 9.99, cycle: 1, categoryId, accountId, user, ...overrides
  })

  const linkTx = (subscriptionId: string, date: number) => {
    db.insert(transactions).values({
      id: generateId(),
      date,
      categoryId,
      amount: 10,
      type: 'expense',
      accountId,
      note: null,
      storeId: null,
      subscriptionId,
      tags: [],
      user
    }).run()
  }

  describe('advanceDate', () => {
    it('advances whole months', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const feb15 = new Date(2025, 1, 15).getTime()
      expect(advanceDate(jan15, 1)).toBe(feb15)
    })

    it('clamps to end of month on overflow (Jan 31 + 1 -> Feb 28)', () => {
      const jan31 = new Date(2025, 0, 31).getTime()
      const feb28 = new Date(2025, 1, 28).getTime()
      expect(advanceDate(jan31, 1)).toBe(feb28)
    })

    it('bimonthly -> advances 2 months', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const mar15 = new Date(2025, 2, 15).getTime()
      expect(advanceDate(jan15, 2)).toBe(mar15)
    })

    it('quarterly -> advances 3 months', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const apr15 = new Date(2025, 3, 15).getTime()
      expect(advanceDate(jan15, 3)).toBe(apr15)
    })

    it('semi-annually -> advances 6 months', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const jul15 = new Date(2025, 6, 15).getTime()
      expect(advanceDate(jan15, 6)).toBe(jul15)
    })

    it('annually -> advances 1 year', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const jan15Next = new Date(2026, 0, 15).getTime()
      expect(advanceDate(jan15, 12)).toBe(jan15Next)
    })

    it('annually edge case: Feb 29 leap year -> Feb 28 next year', () => {
      const feb29 = new Date(2024, 1, 29).getTime()
      const feb28Next = new Date(2025, 1, 28).getTime()
      expect(advanceDate(feb29, 12)).toBe(feb28Next)
    })
  })

  describe('addSubscription', () => {
    it('creates with nextPaymentDate null and serializes raw', () => {
      const result = service.addSubscription(params())
      expect(result._id).toBeDefined()
      expect(result.nextPaymentDate).toBeNull()
      expect(result.categoryId).toBe(categoryId)
      expect(result.user).toBe(user)
    })
  })

  describe('getSubscriptions', () => {
    it('returns populated subscriptions', () => {
      service.addSubscription(params())
      const [row] = service.getSubscriptions(user)
      expect(row.categoryId).toEqual({ _id: categoryId, name: 'Streaming' })
      expect(row.accountId).toEqual({ _id: accountId, name: 'Checking', bank: 'BankA' })
    })
  })

  describe('recalculateNextPaymentDate', () => {
    it('returns null when there are no linked transactions', () => {
      const sub = service.addSubscription(params({ cycle: 1 }))
      expect(service.recalculateNextPaymentDate(sub._id)).toBeNull()
    })

    it('advances from the last linked transaction by cycle', () => {
      const sub = service.addSubscription(params({ cycle: 1 }))
      const lastDate = new Date(2025, 0, 15).getTime()
      linkTx(sub._id, new Date(2024, 11, 15).getTime())
      linkTx(sub._id, lastDate)

      const next = service.recalculateNextPaymentDate(sub._id)
      expect(next).toBe(advanceDate(lastDate, 1))
      expect(repository.findByIdAny(sub._id)?.nextPaymentDate).toBe(next)
    })
  })

  describe('editSubscription', () => {
    it('updates fields without recalculating when cycle is not changed', () => {
      const sub = service.addSubscription(params())
      const result = service.editSubscription(sub._id, { name: 'HBO' }, user)
      expect(result?.name).toBe('HBO')
    })

    it('recalculates nextPaymentDate when cycle changes', () => {
      const sub = service.addSubscription(params({ cycle: 1 }))
      const lastDate = new Date(2025, 0, 15).getTime()
      linkTx(sub._id, lastDate)
      const result = service.editSubscription(sub._id, { cycle: 3 }, user)
      expect(result?.nextPaymentDate).toBe(advanceDate(lastDate, 3))
    })

    it('returns null when the subscription does not exist', () => {
      expect(service.editSubscription('62a39498c4497e1fe3c2bf35', { name: 'X' }, user)).toBeNull()
    })
  })

  describe('deleteSubscription', () => {
    it('unlinks its transactions and removes the subscription', () => {
      const sub = service.addSubscription(params())
      linkTx(sub._id, 1000)
      service.deleteSubscription(sub._id, user)
      expect(repository.findByIdAny(sub._id)).toBeUndefined()
      const stillLinked = db.select().from(transactions).where(eq(transactions.subscriptionId, sub._id)).all()
      expect(stillLinked).toHaveLength(0)
    })
  })
})
