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

describe('Loans Controller (Part C - events / simulation)', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/loans'
  let accountId: string
  let categoryId: string

  const insertLoan = () => {
    const id = generateId()
    sqliteDb.insert(loans).values({
      id,
      name: 'Mortgage',
      initialAmount: 10000,
      pendingAmount: 10000,
      interestRate: 12,
      startDate: Date.UTC(2025, 0, 1),
      monthlyPayment: 500,
      initialEstimatedCost: 11000,
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

  describe('POST /:id/events', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(`${base}/x/events`).expect(401)
    })

    test('non-existent loan responds 404', async () => {
      await supertest(server.app).post(`${base}/62a39498c4497e1fe3c2bf35/events`).auth(token, { type: 'bearer' })
        .send({ date: Date.now(), newRate: 4, newPayment: 520 }).expect(404)
    })

    test('success creates the event and updates loan rate/payment, responds 201', async () => {
      const id = insertLoan()
      const res = await supertest(server.app).post(`${base}/${id}/events`).set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), newRate: 4.5, newPayment: 520 }).expect(201)
      expect(res.body.newRate).toBe(4.5)
      const loan = sqliteDb.select().from(loans).where(eq(loans.id, id)).get()!
      expect(loan.interestRate).toBe(4.5)
      expect(loan.monthlyPayment).toBe(520)
    })
  })

  describe('POST /:id/simulate-payoff', () => {
    test('lumpSum exceeding pendingAmount responds 422', async () => {
      const id = insertLoan()
      await supertest(server.app).post(`${base}/${id}/simulate-payoff`).set('Authorization', `Bearer ${token}`)
        .send({ lumpSum: 15000 }).expect(422)
    })

    test('success returns optionA and optionB', async () => {
      const id = insertLoan()
      const res = await supertest(server.app).post(`${base}/${id}/simulate-payoff`).set('Authorization', `Bearer ${token}`)
        .send({ lumpSum: 2000 }).expect(200)
      expect(res.body.lumpSum).toBe(2000)
      expect(res.body.optionA).toBeDefined()
      expect(res.body.optionB).toBeDefined()
      expect(res.body.optionB.newMonthlyPayment).toBeLessThan(500)
    })
  })
})
