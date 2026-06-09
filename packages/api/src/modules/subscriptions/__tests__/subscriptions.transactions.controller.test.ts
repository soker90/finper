import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { subscriptionsRoutes } from '../subscriptions.routes'

const { subscriptions, transactions, categories, accounts, users } = schema

describe('Subscriptions Controller Part B', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/subscriptions'

  let categoryId: string
  let accountId: string

  const makeSub = (): string => {
    const id = generateId()
    sqliteDb.insert(subscriptions).values({ id, name: 'Netflix', amount: 9.99, cycle: 1, categoryId, accountId, user: username, nextPaymentDate: null }).run()
    return id
  }

  const insertTx = (subscriptionId: string | null, date = 1000): string => {
    const id = generateId()
    sqliteDb.insert(transactions).values({
      id, date, categoryId, amount: 9.99, type: 'expense', accountId,
      note: null, storeId: null, subscriptionId, tags: [], user: username
    }).run()
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
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(subscriptions).where(eq(subscriptions.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(subscriptions).where(eq(subscriptions.user, username)).run()
  })

  describe('GET /:id/transactions', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(`${base}/x/transactions`).expect(401)
    })

    test('non-existent subscription responds 404', async () => {
      await supertest(server.app).get(`${base}/62a39498c4497e1fe3c2bf35/transactions`).auth(token, { type: 'bearer' }).expect(404)
    })

    test('no linked transactions returns empty array', async () => {
      const id = makeSub()
      await supertest(server.app).get(`${base}/${id}/transactions`).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('returns only transactions linked to the subscription', async () => {
      const id = makeSub()
      const tx = insertTx(id)
      insertTx(null)
      const res = await supertest(server.app).get(`${base}/${id}/transactions`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]._id).toBe(tx)
    })
  })

  describe('GET /:id/matching-transactions', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(`${base}/x/matching-transactions`).expect(401)
    })

    test('non-existent subscription returns empty array (not 404)', async () => {
      await supertest(server.app).get(`${base}/62a39498c4497e1fe3c2bf35/matching-transactions`).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('returns unlinked matching transactions with subscriptionId undefined', async () => {
      const id = makeSub()
      insertTx(null)
      const res = await supertest(server.app).get(`${base}/${id}/matching-transactions`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
      res.body.forEach((tx: any) => expect(tx.subscriptionId).toBeUndefined())
    })
  })

  describe('POST /:id/link-transactions', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(`${base}/x/link-transactions`).expect(401)
    })

    test('non-existent subscription responds 404', async () => {
      await supertest(server.app).post(`${base}/62a39498c4497e1fe3c2bf35/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: ['62a39498c4497e1fe3c2bf35'] }).expect(404)
    })

    test('empty transactionIds responds 422', async () => {
      const id = makeSub()
      await supertest(server.app).post(`${base}/${id}/link-transactions`).set('Authorization', `Bearer ${token}`)
        .send({ transactionIds: [] }).expect(422)
    })

    test('links transactions and responds 204', async () => {
      const id = makeSub()
      const tx = insertTx(null)
      await supertest(server.app).post(`${base}/${id}/link-transactions`).set('Authorization', `Bearer ${token}`)
        .send({ transactionIds: [tx] }).expect(204)
      const linked = sqliteDb.select().from(transactions).where(eq(transactions.subscriptionId, id)).all()
      expect(linked).toHaveLength(1)
    })
  })

  describe('DELETE /:id/unlink-transactions/:transactionId', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).delete(`${base}/x/unlink-transactions/y`).expect(401)
    })

    test('non-existent subscription responds 404', async () => {
      await supertest(server.app).delete(`${base}/62a39498c4497e1fe3c2bf35/unlink-transactions/62a39498c4497e1fe3c2bf35`)
        .auth(token, { type: 'bearer' }).expect(404)
    })

    test('unlinks the transaction and responds 204', async () => {
      const id = makeSub()
      const tx = insertTx(id)
      await supertest(server.app).delete(`${base}/${id}/unlink-transactions/${tx}`).set('Authorization', `Bearer ${token}`).expect(204)
      const stillLinked = sqliteDb.select().from(transactions).where(eq(transactions.subscriptionId, id)).all()
      expect(stillLinked).toHaveLength(0)
    })
  })
})
