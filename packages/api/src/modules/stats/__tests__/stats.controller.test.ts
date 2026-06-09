import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId, TRANSACTION } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { statsRoutes } from '../stats.routes'

const { transactions, categories, accounts, users } = schema

describe('Stats Controller', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/stats'

  let categoryId: string
  let accountId: string

  const insertTx = (overrides: Record<string, any> = {}) => {
    sqliteDb.insert(transactions).values({
      id: generateId(),
      date: overrides.date ?? Date.UTC(2025, 5, 15),
      categoryId,
      amount: overrides.amount ?? 100,
      type: overrides.type ?? TRANSACTION.Expense,
      accountId,
      note: null,
      storeId: null,
      subscriptionId: null,
      tags: overrides.tags ?? [],
      user: username
    }).run()
  }

  beforeAll(async () => {
    server.app.use('/test-api/stats', statsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Comida', type: 'expense', user: username }).run()
    accountId = generateId()
    sqliteDb.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
  })

  describe('GET /tags/available', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(`${base}/tags/available`).expect(401)
    })

    test('no tagged transactions returns empty array', async () => {
      await supertest(server.app).get(`${base}/tags/available`).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('returns unique sorted tags', async () => {
      insertTx({ tags: ['juan', 'viaje-japon'] })
      insertTx({ tags: ['juan', 'casa'] })
      const res = await supertest(server.app).get(`${base}/tags/available`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toEqual(['casa', 'juan', 'viaje-japon'])
    })
  })

  describe('GET /tags/years', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(`${base}/tags/years`).expect(401)
    })

    test('returns unique years sorted descending', async () => {
      insertTx({ date: Date.UTC(2023, 5, 15), tags: ['viaje'] })
      insertTx({ date: Date.UTC(2025, 5, 15), tags: ['viaje'] })
      const res = await supertest(server.app).get(`${base}/tags/years`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toEqual([2025, 2023])
    })
  })

  describe('GET /tags', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(`${base}/tags`).expect(401)
    })

    test('returns summary filtered by year query', async () => {
      insertTx({ amount: 100, tags: ['viaje'], date: Date.UTC(2024, 5, 15) })
      insertTx({ amount: 200, tags: ['viaje'], date: Date.UTC(2025, 5, 15) })
      const res = await supertest(server.app).get(`${base}/tags?year=2025`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].totalAmount).toBe(200)
    })
  })

  describe('GET /tags/:tagName', () => {
    test('returns historic data', async () => {
      insertTx({ amount: 100, tags: ['vicente'], date: Date.UTC(2024, 5, 15) })
      insertTx({ amount: 200, tags: ['vicente'], date: Date.UTC(2025, 5, 15) })
      const res = await supertest(server.app).get(`${base}/tags/vicente`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.tag).toBe('vicente')
      expect(res.body.totalAmount).toBe(300)
      expect(res.body.years[0].year).toBe(2025)
    })
  })

  describe('GET /tags/:tagName/:year', () => {
    test('returns detail for the year', async () => {
      insertTx({ amount: 150, tags: ['viaje-japon'], date: Date.UTC(2025, 5, 15) })
      const res = await supertest(server.app).get(`${base}/tags/viaje-japon/2025`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.tag).toBe('viaje-japon')
      expect(res.body.totalAmount).toBe(150)
      expect(res.body.transactions).toHaveLength(1)
    })

    test('non-numeric year responds 422', async () => {
      await supertest(server.app).get(`${base}/tags/juan/notanumber`).auth(token, { type: 'bearer' }).expect(422)
    })

    test('year below 1900 responds 422', async () => {
      await supertest(server.app).get(`${base}/tags/juan/1899`).auth(token, { type: 'bearer' }).expect(422)
    })
  })
})
