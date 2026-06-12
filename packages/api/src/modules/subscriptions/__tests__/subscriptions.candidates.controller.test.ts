import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { subscriptionsRoutes } from '../subscriptions.routes'

const { subscriptions, transactions, categories, accounts, users, subscriptionCandidates } = schema

describe('Subscriptions Controller Part C (candidates)', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/subscriptions'

  let categoryId: string
  let accountId: string

  const makeSub = (nextPaymentDate: number | null = null): string => {
    const id = generateId()
    sqliteDb.insert(subscriptions).values({ id, name: 'Netflix', amount: 9.99, cycle: 1, categoryId, accountId, user: username, nextPaymentDate }).run()
    return id
  }

  const insertTx = (subscriptionId: string | null): string => {
    const id = generateId()
    sqliteDb.insert(transactions).values({
      id,
      date: 1000,
      categoryId,
      amount: 9.99,
      type: 'expense',
      accountId,
      note: null,
      storeId: null,
      subscriptionId,
      tags: [],
      user: username
    }).run()
    return id
  }

  const insertCandidate = (transactionId: string, subscriptionIds: string[], createdAt = Date.now()): string => {
    const id = generateId()
    sqliteDb.insert(subscriptionCandidates).values({ id, transactionId, subscriptionIds, user: username, createdAt }).run()
    return id
  }

  beforeAll(async () => {
    server.app.use('/test-api/subscriptions', subscriptionsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Streaming', type: 'expense', user: username }).run()
    accountId = generateId()
    sqliteDb.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(subscriptionCandidates).where(eq(subscriptionCandidates.user, username)).run()
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(subscriptions).where(eq(subscriptions.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(subscriptionCandidates).where(eq(subscriptionCandidates.user, username)).run()
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(subscriptions).where(eq(subscriptions.user, username)).run()
  })

  describe('GET /candidates', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(`${base}/candidates`).expect(401)
    })

    test('with no candidates returns empty array', async () => {
      await supertest(server.app).get(`${base}/candidates`).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('returns candidates of the user with deep population (transaction category/account + subscriptions)', async () => {
      const tx = insertTx(null)
      const sub = makeSub()
      insertCandidate(tx, [sub])
      const res = await supertest(server.app).get(`${base}/candidates`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].transactionId.category).toEqual({ _id: categoryId, name: 'Streaming' })
      expect(res.body[0].transactionId.account).toEqual({ _id: accountId, name: 'Checking', bank: 'BankA' })
      expect(res.body[0].subscriptionIds[0]).toMatchObject({ _id: sub, name: 'Netflix', amount: 9.99, cycle: 1 })
    })

    test('orders candidates by createdAt desc', async () => {
      const tx = insertTx(null)
      const sub = makeSub()
      insertCandidate(tx, [sub], 100)
      insertCandidate(tx, [sub], 300)
      insertCandidate(tx, [sub], 200)
      const res = await supertest(server.app).get(`${base}/candidates`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.map((c: any) => c.createdAt)).toEqual([300, 200, 100])
    })
  })

  describe('POST /candidates/:id/assign', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(`${base}/candidates/x/assign`).expect(401)
    })

    test('non-existent candidate responds 404', async () => {
      await supertest(server.app).post(`${base}/candidates/62a39498c4497e1fe3c2bf35/assign`).auth(token, { type: 'bearer' })
        .send({ subscriptionId: '62a39498c4497e1fe3c2bf35' }).expect(404)
    })

    test('assigns the transaction to the subscription and responds 204', async () => {
      const tx = insertTx(null)
      const sub = makeSub()
      const candidateId = insertCandidate(tx, [sub])

      await supertest(server.app).post(`${base}/candidates/${candidateId}/assign`).set('Authorization', `Bearer ${token}`)
        .send({ subscriptionId: sub }).expect(204)

      expect(sqliteDb.select().from(transactions).where(eq(transactions.id, tx)).get()?.subscriptionId).toBe(sub)
      const remaining = sqliteDb.select().from(subscriptionCandidates).where(eq(subscriptionCandidates.id, candidateId)).all()
      expect(remaining).toHaveLength(0)
    })
  })

  describe('POST /candidates/:id/dismiss', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(`${base}/candidates/x/dismiss`).expect(401)
    })

    test('non-existent candidate responds 404', async () => {
      await supertest(server.app).post(`${base}/candidates/62a39498c4497e1fe3c2bf35/dismiss`).auth(token, { type: 'bearer' }).expect(404)
    })

    test('dismisses the candidate and responds 204', async () => {
      const tx = insertTx(null)
      const sub = makeSub()
      const candidateId = insertCandidate(tx, [sub])

      await supertest(server.app).post(`${base}/candidates/${candidateId}/dismiss`).set('Authorization', `Bearer ${token}`).expect(204)

      const remaining = sqliteDb.select().from(subscriptionCandidates).where(eq(subscriptionCandidates.id, candidateId)).all()
      expect(remaining).toHaveLength(0)
    })
  })
})
