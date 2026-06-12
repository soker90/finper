import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createSubscriptionsRepository } from '../subscriptions.repository'
import { SubscriptionsService } from '../subscriptions.service'
import { SubscriptionCandidateService } from '../subscription-candidate.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { subscriptions, transactions, categories, accounts, users, subscriptionCandidates } = schema
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
const NOW = new Date(2025, 0, 15).getTime()

describe('Subscriptions Part C (candidates)', () => {
  let db: DB
  let repository: ReturnType<typeof createSubscriptionsRepository>
  let subscriptionsService: SubscriptionsService
  let service: SubscriptionCandidateService
  let user: string
  let categoryId: string
  let accountId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createSubscriptionsRepository(db)
    subscriptionsService = new SubscriptionsService(repository)
    service = new SubscriptionCandidateService(repository, subscriptionsService)
    user = generateUsername()
    db.insert(users).values({ id: 'sub-c-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Streaming', type: 'expense', user }).run()
    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user }).run()
  })

  afterAll(() => {
    db.delete(subscriptionCandidates).where(eq(subscriptionCandidates.user, user)).run()
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(subscriptions).where(eq(subscriptions.user, user)).run()
    db.delete(categories).where(eq(categories.user, user)).run()
    db.delete(accounts).where(eq(accounts.user, user)).run()
    db.delete(users).where(eq(users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(subscriptionCandidates).where(eq(subscriptionCandidates.user, user)).run()
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(subscriptions).where(eq(subscriptions.user, user)).run()
  })

  const makeSub = (nextPaymentDate: number | null, cycle = 1) => {
    const id = generateId()
    db.insert(subscriptions).values({ id, name: 'Netflix', amount: 9.99, cycle, categoryId, accountId, user, nextPaymentDate }).run()
    return id
  }

  const insertTx = (subscriptionId: string | null, date = NOW) => {
    const id = generateId()
    db.insert(transactions).values({
      id,
      date,
      categoryId,
      amount: 9.99,
      type: 'expense',
      accountId,
      note: 'pay',
      storeId: null,
      subscriptionId,
      tags: [],
      user
    }).run()
    return id
  }

  const txForDetect = (overrides: Record<string, any> = {}) => ({
    id: overrides.id ?? generateId(),
    date: overrides.date ?? NOW,
    categoryId: overrides.categoryId ?? categoryId,
    accountId: overrides.accountId ?? accountId,
    user: overrides.user ?? user
  })

  const insertCandidate = (transactionId: string, subscriptionIds: string[], createdAt = Date.now()) => {
    const id = generateId()
    db.insert(subscriptionCandidates).values({ id, transactionId, subscriptionIds, user, createdAt }).run()
    return id
  }

  describe('detectCandidates', () => {
    it('does nothing when there are no matching subscriptions', () => {
      service.detectCandidates(txForDetect())
      expect(db.select().from(subscriptionCandidates).where(eq(subscriptionCandidates.user, user)).all()).toHaveLength(0)
    })

    it('detects subscriptions whose nextPaymentDate is within ±7 days', () => {
      makeSub(NOW)
      makeSub(NOW + ONE_WEEK_MS - 86400000)
      makeSub(NOW + ONE_WEEK_MS + 86400000)
      makeSub(null)

      service.detectCandidates(txForDetect())

      const candidates = db.select().from(subscriptionCandidates).where(eq(subscriptionCandidates.user, user)).all()
      expect(candidates).toHaveLength(1)
      expect(candidates[0].subscriptionIds).toHaveLength(2)
    })

    it('ignores subscriptions of other users', () => {
      const other = generateUsername()
      db.insert(users).values({ id: 'sub-c-other', username: other, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
      const oc = generateId(); db.insert(categories).values({ id: oc, name: 'X', type: 'expense', user: other }).run()
      const oa = generateId(); db.insert(accounts).values({ id: oa, name: 'X', bank: 'X', balance: 0, user: other }).run()
      db.insert(subscriptions).values({ id: generateId(), name: 'S', amount: 1, cycle: 1, categoryId: oc, accountId: oa, user: other, nextPaymentDate: NOW }).run()

      service.detectCandidates(txForDetect())
      expect(db.select().from(subscriptionCandidates).where(eq(subscriptionCandidates.user, user)).all()).toHaveLength(0)

      db.delete(subscriptions).where(eq(subscriptions.user, other)).run()
      db.delete(accounts).where(eq(accounts.user, other)).run()
      db.delete(categories).where(eq(categories.user, other)).run()
      db.delete(users).where(eq(users.username, other)).run()
    })
  })

  describe('getCandidates', () => {
    it('returns empty array when there are none', () => {
      expect(service.getCandidates(user)).toEqual([])
    })

    it('populates transactionId (category/account) and subscriptionIds', () => {
      const tx = insertTx(null)
      const sub = makeSub(NOW)
      insertCandidate(tx, [sub])

      const [candidate] = service.getCandidates(user)
      expect(candidate.transactionId.category).toEqual({ _id: categoryId, name: 'Streaming' })
      expect(candidate.transactionId.account).toEqual({ _id: accountId, name: 'Checking', bank: 'BankA' })
      expect(candidate.subscriptionIds[0]).toMatchObject({ _id: sub, name: 'Netflix', amount: 9.99, cycle: 1 })
    })

    it('orders by createdAt desc and filters by user', () => {
      const tx = insertTx(null)
      const sub = makeSub(NOW)
      insertCandidate(tx, [sub], 100)
      insertCandidate(tx, [sub], 300)
      insertCandidate(tx, [sub], 200)

      const created = service.getCandidates(user).map(c => c.createdAt)
      expect(created).toEqual([300, 200, 100])
    })
  })

  describe('assignSubscription', () => {
    it('links the transaction, recalculates nextPaymentDate and deletes the candidate', () => {
      const tx = insertTx(null, NOW)
      const sub = makeSub(null, 1)
      const candidateId = insertCandidate(tx, [sub])

      service.assignSubscription(candidateId, sub)

      expect(db.select().from(transactions).where(eq(transactions.id, tx)).get()?.subscriptionId).toBe(sub)
      expect(repository.findByIdAny(sub)?.nextPaymentDate).not.toBeNull()
      expect(repository.findCandidateById(candidateId)).toBeUndefined()
    })
  })

  describe('dismissCandidate', () => {
    it('deletes the candidate without touching the transaction', () => {
      const tx = insertTx(null)
      const sub = makeSub(NOW)
      const candidateId = insertCandidate(tx, [sub])

      service.dismissCandidate(candidateId)

      expect(repository.findCandidateById(candidateId)).toBeUndefined()
      expect(db.select().from(transactions).where(eq(transactions.id, tx)).get()?.subscriptionId).toBeNull()
    })
  })
})
