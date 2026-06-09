import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { loansRoutes } from '../loans.routes'

const { loans, loanPayments, loanEvents, transactions, categories, accounts, users } = schema

describe('Loans Controller (Part B - payments)', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/loans'
  let accountId: string
  let categoryId: string

  const insertLoan = (overrides: Record<string, any> = {}) => {
    const id = generateId()
    sqliteDb.insert(loans).values({
      id,
      name: 'Mortgage',
      initialAmount: overrides.initialAmount ?? 10000,
      pendingAmount: overrides.pendingAmount ?? 10000,
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

  const balanceOf = () => sqliteDb.select().from(accounts).where(eq(accounts.id, accountId)).get()!.balance

  beforeAll(async () => {
    server.app.use('/test-api/loans', loansRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
    accountId = generateId()
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Hipoteca', type: 'expense', user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(loanPayments).where(eq(loanPayments.user, username)).run()
    sqliteDb.delete(loanEvents).where(eq(loanEvents.user, username)).run()
    sqliteDb.delete(loans).where(eq(loans.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  beforeEach(() => {
    sqliteDb.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 1000, user: username }).run()
  })

  afterEach(() => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(loanPayments).where(eq(loanPayments.user, username)).run()
    sqliteDb.delete(loanEvents).where(eq(loanEvents.user, username)).run()
    sqliteDb.delete(loans).where(eq(loans.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
  })

  describe('POST /:id/pay', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(`${base}/x/pay`).expect(401)
    })

    test('non-existent loan responds 404', async () => {
      await supertest(server.app).post(`${base}/62a39498c4497e1fe3c2bf35/pay`).auth(token, { type: 'bearer' }).send({}).expect(404)
    })

    test('addMovement:true creates payment, lowers pendingAmount, deducts balance and creates a movement', async () => {
      const id = insertLoan()
      const res = await supertest(server.app).post(`${base}/${id}/pay`).set('Authorization', `Bearer ${token}`)
        .send({ addMovement: true }).expect(201)
      expect(res.body.type).toBe('ordinary')
      expect(balanceOf()).toBe(500)
      expect(sqliteDb.select().from(transactions).where(eq(transactions.user, username)).all()).toHaveLength(1)
    })

    test('addMovement:false does not change balance nor create a movement', async () => {
      const id = insertLoan()
      await supertest(server.app).post(`${base}/${id}/pay`).set('Authorization', `Bearer ${token}`)
        .send({ addMovement: false }).expect(201)
      expect(balanceOf()).toBe(1000)
      expect(sqliteDb.select().from(transactions).where(eq(transactions.user, username)).all()).toHaveLength(0)
    })

    test('already paid (pendingAmount 0) responds 400', async () => {
      const id = insertLoan({ pendingAmount: 0 })
      await supertest(server.app).post(`${base}/${id}/pay`).set('Authorization', `Bearer ${token}`).send({}).expect(400)
    })
  })

  describe('POST /:id/amortize', () => {
    test('amount missing responds 422', async () => {
      const id = insertLoan()
      await supertest(server.app).post(`${base}/${id}/amortize`).set('Authorization', `Bearer ${token}`)
        .send({ mode: 'reduceTerm' }).expect(422)
    })

    test('mode missing responds 422', async () => {
      const id = insertLoan()
      await supertest(server.app).post(`${base}/${id}/amortize`).set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000 }).expect(422)
    })

    test('reduceTerm creates extraordinary payment, lowers pendingAmount and deducts balance', async () => {
      const id = insertLoan()
      const res = await supertest(server.app).post(`${base}/${id}/amortize`).set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000, mode: 'reduceTerm' }).expect(201)
      expect(res.body.type).toBe('extraordinary')
      expect(balanceOf()).toBe(0)
    })
  })

  describe('DELETE /:id/payments/:paymentId', () => {
    test('reverses balance and removes the payment, responds 204', async () => {
      const id = insertLoan()
      const pay = await supertest(server.app).post(`${base}/${id}/pay`).set('Authorization', `Bearer ${token}`).send({}).expect(201)
      await supertest(server.app).delete(`${base}/${id}/payments/${pay.body._id}`).set('Authorization', `Bearer ${token}`).expect(204)
      expect(balanceOf()).toBe(1000)
      expect(sqliteDb.select().from(loanPayments).where(eq(loanPayments.user, username)).all()).toHaveLength(0)
    })
  })

  describe('PUT /:id/payments/:paymentId', () => {
    test('updates the payment and responds 200', async () => {
      const id = insertLoan()
      const pay = await supertest(server.app).post(`${base}/${id}/pay`).set('Authorization', `Bearer ${token}`).send({}).expect(201)
      const res = await supertest(server.app).put(`${base}/${id}/payments/${pay.body._id}`).set('Authorization', `Bearer ${token}`)
        .send({ amount: 600, principal: 500 }).expect(200)
      expect(res.body.amount).toBe(600)
    })
  })
})
