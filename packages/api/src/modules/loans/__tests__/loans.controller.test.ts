import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import testDatabase from '../../../../test/test-db'
import { mongoose } from '@soker90/finper-models'
import { loansRoutes } from '../loans.routes'

const { loans, loanPayments, loanEvents, categories, accounts, users } = schema
const dbInstance = testDatabase(mongoose)

describe('Loans Controller (Part A)', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/loans'
  let accountId: string
  let categoryId: string

  const validBody = () => ({
    name: 'Mortgage',
    initialAmount: 100000,
    interestRate: 3.5,
    startDate: Date.UTC(2025, 0, 1),
    monthlyPayment: 600,
    account: accountId,
    category: categoryId
  })

  const insertLoan = () => {
    const id = generateId()
    sqliteDb.insert(loans).values({
      id,
      name: 'L',
      initialAmount: 1000,
      pendingAmount: 1000,
      interestRate: 3,
      startDate: Date.UTC(2025, 0, 1),
      monthlyPayment: 100,
      initialEstimatedCost: 1050,
      accountId,
      categoryId,
      user: username
    }).run()
    return id
  }

  beforeAll(async () => {
    await dbInstance.connect()
    server.app.use('/test-api/loans', loansRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
    accountId = generateId()
    sqliteDb.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user: username }).run()
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Hipoteca', type: 'expense', user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(loanPayments).where(eq(loanPayments.user, username)).run()
    sqliteDb.delete(loanEvents).where(eq(loanEvents.user, username)).run()
    sqliteDb.delete(loans).where(eq(loans.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
    await dbInstance.close()
  })

  afterEach(() => {
    sqliteDb.delete(loanPayments).where(eq(loanPayments.user, username)).run()
    sqliteDb.delete(loanEvents).where(eq(loanEvents.user, username)).run()
    sqliteDb.delete(loans).where(eq(loans.user, username)).run()
  })

  describe('GET /', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(base).expect(401)
    })

    test('no loans returns empty array', async () => {
      await supertest(server.app).get(base).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('returns loans of the user', async () => {
      insertLoan()
      const res = await supertest(server.app).get(base).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].account).toBe(accountId)
    })
  })

  describe('POST /', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(base).expect(401)
    })

    test('no params responds 422', async () => {
      await supertest(server.app).post(base).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test('success responds 201 with pendingAmount === initialAmount and initialEstimatedCost > 0', async () => {
      const body = validBody()
      const res = await supertest(server.app).post(base).set('Authorization', `Bearer ${token}`).send(body).expect(201)
      expect(res.body.pendingAmount).toBe(body.initialAmount)
      expect(res.body.initialEstimatedCost).toBeGreaterThan(0)
    })
  })

  describe('GET /:id', () => {
    test('invalid id responds 400', async () => {
      await supertest(server.app).get(`${base}/not-a-valid-id`).auth(token, { type: 'bearer' }).expect(400)
    })

    test('non-existent loan responds 404', async () => {
      await supertest(server.app).get(`${base}/62a39498c4497e1fe3c2bf35`).auth(token, { type: 'bearer' }).expect(404)
    })

    test('success responds 200 with stats and amortizationTable', async () => {
      const id = insertLoan()
      const res = await supertest(server.app).get(`${base}/${id}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.stats).toBeDefined()
      expect(Array.isArray(res.body.amortizationTable)).toBe(true)
    })
  })

  describe('PUT /:id', () => {
    test('non-existent loan responds 404', async () => {
      await supertest(server.app).put(`${base}/62a39498c4497e1fe3c2bf35`).auth(token, { type: 'bearer' }).send({ name: 'X' }).expect(404)
    })

    test('success responds 200 and updates name', async () => {
      const id = insertLoan()
      const res = await supertest(server.app).put(`${base}/${id}`).set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed', account: accountId, category: categoryId }).expect(200)
      expect(res.body.name).toBe('Renamed')
      expect(res.body.account).toBe(accountId)
    })
  })

  describe('DELETE /:id', () => {
    test('success responds 204', async () => {
      const id = insertLoan()
      await supertest(server.app).delete(`${base}/${id}`).set('Authorization', `Bearer ${token}`).expect(204)
      expect(sqliteDb.select().from(loans).where(eq(loans.id, id)).all()).toHaveLength(0)
    })
  })
})
