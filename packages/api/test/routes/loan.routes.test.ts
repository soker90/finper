import supertest from 'supertest'
import {
  AccountModel,
  LoanModel,
  LoanPaymentModel,
  LoanEventModel,
  LOAN_PAYMENT,
  TransactionModel,
  mongoose
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertLoan, insertLoanPayment, insertAccount, insertCategory } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'
import { roundNumber } from '../../src/utils/roundNumber'
import { calcMonthlyPayment, calcRemainingMonths } from '../../src/services/utils/calcLoanProjection'

const testDatabase = require('../test-db')(mongoose)

describe('Loans', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())

  // ─── GET / ────────────────────────────────────────────────────────────────
  describe('GET /api/loans', () => {
    const path = '/api/loans'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no loans, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are loans, it should return only the loans of the user', async () => {
      const loan = await insertLoan({ user })
      await insertLoan() // otro usuario

      const res = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]._id).toBe(loan._id.toString())
    })
  })

  // ─── POST / ───────────────────────────────────────────────────────────────
  describe('POST /api/loans', () => {
    const path = '/api/loans'
    let token: string
    const user = generateUsername()
    let accountId: string
    let categoryId: string

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
      const account = await insertAccount({ user })
      accountId = account._id.toString()
      const category = await insertCategory({ user })
      categoryId = category._id.toString()
    })

    const validBody = () => ({
      name: faker.lorem.words(2),
      initialAmount: 10000,
      interestRate: 3,
      startDate: Date.now(),
      monthlyPayment: 200,
      account: accountId,
      category: categoryId
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should respond 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['name', 'initialAmount', 'interestRate', 'startDate', 'monthlyPayment', 'account', 'category'])(
      'when %s is missing, it should respond 422',
      async (param) => {
        const body = validBody() as Record<string, any>
        delete body[param]
        await supertest(server.app)
          .post(path)
          .auth(token, { type: 'bearer' })
          .send(body)
          .expect(422)
      }
    )

    test('when success, it should respond 201 with pendingAmount === initialAmount and initialEstimatedCost > 0', async () => {
      const body = validBody()
      const res = await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send(body)
        .expect(201)

      expect(res.body.pendingAmount).toBe(body.initialAmount)
      expect(res.body.initialEstimatedCost).toBeGreaterThan(0)
    })
  })

  // ─── GET /:id ─────────────────────────────────────────────────────────────
  describe('GET /api/loans/:id', () => {
    const path = (id: string) => `/api/loans/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).get(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when id is not a valid ObjectId, it should respond 400', async () => {
      await supertest(server.app).get(path('not-a-valid-id')).auth(token, { type: 'bearer' }).expect(400)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app).get(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when loan belongs to another user, it should respond 404', async () => {
      const loan = await insertLoan()
      await supertest(server.app).get(path(loan._id.toString())).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when success, it should respond 200 with stats and amortizationTable', async () => {
      const loan = await insertLoan({ user })
      const res = await supertest(server.app).get(path(loan._id.toString())).auth(token, { type: 'bearer' }).expect(200)

      expect(res.body.stats).toBeDefined()
      expect(res.body.amortizationTable).toBeDefined()
      expect(Array.isArray(res.body.amortizationTable)).toBe(true)
    })

    test('after addEvent, stats.currentRate and stats.currentPayment reflect the new event values', async () => {
      const loan = await insertLoan({ user, interestRate: 3, monthlyPayment: 500 })
      const newRate = 4.5
      const newPayment = 520

      await supertest(server.app)
        .post(`/api/loans/${loan._id}/events`)
        .auth(token, { type: 'bearer' })
        .send({ date: Date.now() - 1000, newRate, newPayment })
        .expect(201)

      const res = await supertest(server.app).get(path(loan._id.toString())).auth(token, { type: 'bearer' }).expect(200)

      expect(res.body.stats.currentRate).toBe(newRate)
      expect(res.body.stats.currentPayment).toBe(newPayment)
    })
  })

  // ─── PUT /:id ─────────────────────────────────────────────────────────────
  describe('PUT /api/loans/:id', () => {
    const path = (id: string) => `/api/loans/${id}`
    let token: string
    const user = generateUsername()
    let accountId: string
    let categoryId: string

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
      const account = await insertAccount({ user })
      accountId = account._id.toString()
      const category = await insertCategory({ user })
      categoryId = category._id.toString()
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .put(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .send({ name: 'nuevo' })
        .expect(404)
    })

    test('when loan belongs to another user, it should respond 404', async () => {
      const loan = await insertLoan()
      await supertest(server.app)
        .put(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ name: 'nuevo' })
        .expect(404)
    })

    test.each(['initialAmount', 'interestRate', 'monthlyPayment', 'startDate'])(
      'when body contains only %s (financial field), it should respond 422',
      async (field) => {
        const loan = await insertLoan({ user })
        await supertest(server.app)
          .put(path(loan._id.toString()))
          .auth(token, { type: 'bearer' })
          .send({ [field]: 9999 })
          .expect(422)
      }
    )

    test('when success, it should respond 200 and update name, account and category', async () => {
      const loan = await insertLoan({ user })
      const newName = faker.lorem.words(2)
      const res = await supertest(server.app)
        .put(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ name: newName, account: accountId, category: categoryId })
        .expect(200)

      expect(res.body.name).toBe(newName)
      expect(res.body.account).toBe(accountId)
      expect(res.body.category).toBe(categoryId)
    })
  })

  // ─── DELETE /:id ──────────────────────────────────────────────────────────
  describe('DELETE /api/loans/:id', () => {
    const path = (id: string) => `/api/loans/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).delete(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app).delete(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when loan belongs to another user, it should respond 404', async () => {
      const loan = await insertLoan()
      await supertest(server.app).delete(path(loan._id.toString())).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when success, it should respond 204 and delete associated payments and events', async () => {
      const loan = await insertLoan({ user })
      const loanId = loan._id.toString()
      await insertLoanPayment({ loan: loanId, user })
      await LoanEventModel.create({ loan: loanId, date: Date.now(), newRate: 3, newPayment: 200, user })

      await supertest(server.app).delete(path(loanId)).auth(token, { type: 'bearer' }).expect(204)

      const remaining = await LoanModel.findById(loanId)
      expect(remaining).toBeNull()
      const payments = await LoanPaymentModel.find({ loan: loanId })
      expect(payments).toHaveLength(0)
      const events = await LoanEventModel.find({ loan: loanId })
      expect(events).toHaveLength(0)
    })
  })

  // ─── POST /:id/pay ────────────────────────────────────────────────────────
  describe('POST /api/loans/:id/pay', () => {
    const path = (id: string) => `/api/loans/${id}/pay`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app).post(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' }).send({}).expect(404)
    })

    test('with addMovement:true, should create ordinary payment, decrease pendingAmount, decrease account balance and create Transaction', async () => {
      const initialBalance = 5000
      const account = await insertAccount({ user, balance: initialBalance })
      const category = await insertCategory({ user })
      const initialAmount = 10000
      const interestRate = 3
      const monthlyPayment = 200
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount, pendingAmount: initialAmount, interestRate, monthlyPayment })

      const res = await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ addMovement: true })
        .expect(201)

      expect(res.body.type).toBe(LOAN_PAYMENT.ORDINARY)

      // interest = 10000 * 3% / 12 = 25; principal = 200 - 25 = 175; pendingAmount = 10000 - 175 = 9825
      const expectedInterest = roundNumber(initialAmount * interestRate / 100 / 12)
      const expectedPrincipal = roundNumber(monthlyPayment - expectedInterest)
      const expectedPending = roundNumber(initialAmount - expectedPrincipal)

      const updatedLoan = await LoanModel.findById(loan._id).lean()
      expect(updatedLoan!.pendingAmount).toBe(expectedPending)

      const updatedAccount = await AccountModel.findById(account._id).lean()
      expect(updatedAccount!.balance).toBe(roundNumber(initialBalance - res.body.amount))

      const transactions = await TransactionModel.find({ user, account: account._id })
      expect(transactions).toHaveLength(1)
    })

    test('with addMovement:false, should create ordinary payment, decrease pendingAmount, NOT change account balance and NOT create Transaction', async () => {
      const initialBalance = 5000
      const account = await insertAccount({ user, balance: initialBalance })
      const category = await insertCategory({ user })
      const initialAmount = 10000
      const interestRate = 3
      const monthlyPayment = 200
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount, pendingAmount: initialAmount, interestRate, monthlyPayment })

      const txCountBefore = await TransactionModel.countDocuments({ user, account: account._id })

      const res = await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ addMovement: false })
        .expect(201)

      expect(res.body.type).toBe(LOAN_PAYMENT.ORDINARY)

      const expectedInterest = roundNumber(initialAmount * interestRate / 100 / 12)
      const expectedPrincipal = roundNumber(monthlyPayment - expectedInterest)
      const expectedPending = roundNumber(initialAmount - expectedPrincipal)

      const updatedLoan = await LoanModel.findById(loan._id).lean()
      expect(updatedLoan!.pendingAmount).toBe(expectedPending)

      const updatedAccount = await AccountModel.findById(account._id).lean()
      expect(updatedAccount!.balance).toBe(initialBalance)

      const txCountAfter = await TransactionModel.countDocuments({ user, account: account._id })
      expect(txCountAfter).toBe(txCountBefore)
    })

    test('concurrent payments both deduct from account balance correctly', async () => {
      const initialBalance = 10000
      const account = await insertAccount({ user, balance: initialBalance })
      const category = await insertCategory({ user })
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount: 10000, pendingAmount: 10000 })

      const [res1, res2] = await Promise.all([
        supertest(server.app).post(path(loan._id.toString())).auth(token, { type: 'bearer' }).send({ addMovement: true }),
        supertest(server.app).post(path(loan._id.toString())).auth(token, { type: 'bearer' }).send({ addMovement: true })
      ])

      expect(res1.status).toBe(201)
      expect(res2.status).toBe(201)

      const total = roundNumber(res1.body.amount + res2.body.amount)
      const updatedAccount = await AccountModel.findById(account._id).lean()
      expect(updatedAccount!.balance).toBe(roundNumber(initialBalance - total))
    })
    test('when loan is already paid off (pendingAmount = 0), it should respond 400', async () => {
      const account = await insertAccount({ user, balance: 5000 })
      const category = await insertCategory({ user })
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount: 10000, pendingAmount: 0 })

      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({})
        .expect(400)
    })

    test('with custom amount, should use that amount and distribute interest/principal correctly', async () => {
      const initialBalance = 5000
      const interestRate = 3
      const initialAmount = 10000
      const account = await insertAccount({ user, balance: initialBalance })
      const category = await insertCategory({ user })
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount, pendingAmount: initialAmount, interestRate })

      // Standard monthly interest: 10000 * 3% / 12 = 25
      const standardInterest = roundNumber(initialAmount * interestRate / 100 / 12)
      // Standard principal: monthlyPayment(200) - interest(25) = 175
      const standardPrincipal = roundNumber(200 - standardInterest)
      // Custom amount: standard + 50 extra (all extra goes to interest in the current implementation)
      const customAmount = roundNumber(standardInterest + standardPrincipal + 50)

      const res = await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ amount: customAmount, addMovement: false })
        .expect(201)

      expect(res.body.amount).toBe(customAmount)
      // principal stays the same regardless of custom amount
      expect(res.body.principal).toBe(standardPrincipal)
      expect(res.body.interest).toBe(roundNumber(customAmount - standardPrincipal))

      const updatedLoan = await LoanModel.findById(loan._id).lean()
      expect(updatedLoan!.pendingAmount).toBe(roundNumber(initialAmount - standardPrincipal))
    })
  })

  // ─── POST /:id/amortize ───────────────────────────────────────────────────
  describe('POST /api/loans/:id/amortize', () => {
    const path = (id: string) => `/api/loans/${id}/amortize`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .post(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .send({ amount: 500, mode: 'reduceTerm' })
        .expect(404)
    })

    test('when amount is missing, it should respond 422', async () => {
      const loan = await insertLoan({ user })
      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ mode: 'reduceTerm' })
        .expect(422)
    })

    test('when mode is missing, it should respond 422', async () => {
      const loan = await insertLoan({ user })
      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ amount: 500 })
        .expect(422)
    })

    test('reduceTerm: should create extraordinary payment, decrease pendingAmount, keep monthlyPayment, decrease account balance', async () => {
      const initialBalance = 10000
      const account = await insertAccount({ user, balance: initialBalance })
      const category = await insertCategory({ user })
      const initialAmount = 10000
      const monthlyPayment = 200
      const interestRate = 3
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount, pendingAmount: initialAmount, monthlyPayment, interestRate })

      const amortizeAmount = 500

      const res = await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ amount: amortizeAmount, mode: 'reduceTerm', addMovement: true })
        .expect(201)

      expect(res.body.type).toBe(LOAN_PAYMENT.EXTRAORDINARY)
      // amortizeAmount <= pendingAmount so all goes to principal
      expect(res.body.principal).toBe(amortizeAmount)
      expect(res.body.interest).toBe(0)

      const updatedLoan = await LoanModel.findById(loan._id).lean()
      expect(updatedLoan!.pendingAmount).toBe(roundNumber(initialAmount - amortizeAmount))
      expect(updatedLoan!.monthlyPayment).toBe(monthlyPayment)

      const updatedAccount = await AccountModel.findById(account._id).lean()
      expect(updatedAccount!.balance).toBe(roundNumber(initialBalance - amortizeAmount))
    })

    test('reduceQuota: should recalculate monthlyPayment to a lower value', async () => {
      const account = await insertAccount({ user, balance: 10000 })
      const category = await insertCategory({ user })
      const initialAmount = 10000
      const interestRate = 3
      const monthlyPayment = calcMonthlyPayment(initialAmount, interestRate, 60) // exact payment for 60 months
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount, pendingAmount: initialAmount, monthlyPayment, interestRate })

      const amortizeAmount = 1000

      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ amount: amortizeAmount, mode: 'reduceQuota', addMovement: true })
        .expect(201)

      // The service recalculates: remaining = calcRemainingMonths(pendingAfter, rate, oldPayment)
      // then newPayment = calcMonthlyPayment(pendingAfter, rate, remaining)
      const pendingAfter = roundNumber(initialAmount - amortizeAmount)
      const remaining = calcRemainingMonths(pendingAfter, interestRate, monthlyPayment)
      const expectedNewPayment = calcMonthlyPayment(pendingAfter, interestRate, remaining)

      const updatedLoan = await LoanModel.findById(loan._id).lean()
      expect(updatedLoan!.monthlyPayment).toBe(expectedNewPayment)
      // Confirm it's actually lower than the original
      expect(updatedLoan!.monthlyPayment).toBeLessThan(monthlyPayment)
    })

    test('addMovement:false: should not change account balance', async () => {
      const initialBalance = 10000
      const account = await insertAccount({ user, balance: initialBalance })
      const category = await insertCategory({ user })
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount: 10000, pendingAmount: 10000 })

      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ amount: 500, mode: 'reduceTerm', addMovement: false })
        .expect(201)

      const updatedAccount = await AccountModel.findById(account._id).lean()
      expect(updatedAccount!.balance).toBe(initialBalance)
    })

    test('when amount > pendingAmount, excess goes to interest and principal is capped at pendingAmount', async () => {
      const pendingAmount = 300
      const account = await insertAccount({ user, balance: 10000 })
      const category = await insertCategory({ user })
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount: 10000, pendingAmount })

      const amortizeAmount = 500 // 200 more than pending

      const res = await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ amount: amortizeAmount, mode: 'reduceTerm', addMovement: false })
        .expect(201)

      expect(res.body.principal).toBe(pendingAmount)
      expect(res.body.interest).toBe(roundNumber(amortizeAmount - pendingAmount))
      expect(res.body.amount).toBe(amortizeAmount)

      const updatedLoan = await LoanModel.findById(loan._id).lean()
      expect(updatedLoan!.pendingAmount).toBe(0)
    })
  })

  // ─── POST /:id/events ─────────────────────────────────────────────────────
  describe('POST /api/loans/:id/events', () => {
    const path = (id: string) => `/api/loans/${id}/events`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .post(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .send({ date: Date.now(), newRate: 4, newPayment: 210 })
        .expect(404)
    })

    test.each(['date', 'newRate', 'newPayment'])(
      'when %s is missing, it should respond 422',
      async (param) => {
        const loan = await insertLoan({ user })
        const body: Record<string, any> = { date: Date.now(), newRate: 4, newPayment: 210 }
        delete body[param]
        await supertest(server.app)
          .post(path(loan._id.toString()))
          .auth(token, { type: 'bearer' })
          .send(body)
          .expect(422)
      }
    )

    test('when success, should create LoanEvent and update loan interestRate and monthlyPayment', async () => {
      const loan = await insertLoan({ user, interestRate: 3, monthlyPayment: 200 })
      const newRate = 4
      const newPayment = 220

      const res = await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ date: Date.now(), newRate, newPayment })
        .expect(201)

      expect(res.body.newRate).toBe(newRate)
      expect(res.body.newPayment).toBe(newPayment)

      const events = await LoanEventModel.find({ loan: loan._id })
      expect(events).toHaveLength(1)

      const updatedLoan = await LoanModel.findById(loan._id).lean()
      expect(updatedLoan!.interestRate).toBe(newRate)
      expect(updatedLoan!.monthlyPayment).toBe(newPayment)
    })

    test('with a past-dated event, getLoanDetail projection uses that rate', async () => {
      const interestRate = 3
      const monthlyPayment = 200
      const initialAmount = 10000
      const loan = await insertLoan({ user, interestRate, monthlyPayment, initialAmount, pendingAmount: initialAmount })

      const pastDate = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days ago
      const newRate = 5.5
      const newPayment = 220

      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ date: pastDate, newRate, newPayment })
        .expect(201)

      const detailRes = await supertest(server.app)
        .get(`/api/loans/${loan._id}`)
        .auth(token, { type: 'bearer' })
        .expect(200)

      // The event is in the past so it is "current" — projection should use newRate and newPayment
      expect(detailRes.body.stats.currentRate).toBe(newRate)
      expect(detailRes.body.stats.currentPayment).toBe(newPayment)

      // The projected rows should use the new rate (interest = pendingAmount * newRate/100/12)
      const firstProjected = detailRes.body.amortizationTable.find((r: any) => r.isProjected)
      const expectedInterest = roundNumber(initialAmount * newRate / 100 / 12)
      expect(firstProjected.interest).toBe(expectedInterest)
    })
  })

  // ─── DELETE /:id/payments/:paymentId ──────────────────────────────────────
  describe('DELETE /api/loans/:id/payments/:paymentId', () => {
    const path = (id: string, paymentId: string) => `/api/loans/${id}/payments/${paymentId}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).delete(path('62a39498c4497e1fe3c2bf35', '62a39498c4497e1fe3c2bf36')).expect(401)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .delete(path('62a39498c4497e1fe3c2bf35', '62a39498c4497e1fe3c2bf36'))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when payment does not exist, it should respond 404', async () => {
      const loan = await insertLoan({ user })
      await supertest(server.app)
        .delete(path(loan._id.toString(), '62a39498c4497e1fe3c2bf36'))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('deleting an ordinary payment should restore pendingAmount, restore account balance and delete the Transaction', async () => {
      const initialBalance = 5000
      const account = await insertAccount({ user, balance: initialBalance })
      const category = await insertCategory({ user })
      const initialAmount = 10000
      const principal = 175
      // The loan already has one payment applied: initialPending = initialAmount - principal
      const initialPending = roundNumber(initialAmount - principal)
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount, pendingAmount: initialPending })
      const loanId = loan._id.toString()

      const paymentAmount = 200
      const paymentDate = Date.now()
      const payment = await insertLoanPayment({
        loan: loanId,
        user,
        amount: paymentAmount,
        date: paymentDate,
        type: LOAN_PAYMENT.ORDINARY,
        principal,
        accumulatedPrincipal: principal,
        pendingCapital: initialPending
      })

      // Create the linked transaction manually
      await TransactionModel.create({
        date: paymentDate,
        category: category._id,
        amount: paymentAmount,
        type: 'expense',
        account: account._id,
        user
      })

      await supertest(server.app)
        .delete(path(loanId, payment._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(204)

      // After deletion, _recalcChain rebuilds from scratch: no payments → pendingAmount = initialAmount
      const updatedLoan = await LoanModel.findById(loanId).lean()
      expect(updatedLoan!.pendingAmount).toBe(initialAmount)

      // Account balance restored by -(-paymentAmount) = +paymentAmount
      const updatedAccount = await AccountModel.findById(account._id).lean()
      expect(updatedAccount!.balance).toBe(roundNumber(initialBalance + paymentAmount))

      const tx = await TransactionModel.findOne({ user, account: account._id, amount: paymentAmount, date: paymentDate })
      expect(tx).toBeNull()
    })

    test('deleting an extraordinary payment should restore pendingAmount and restore account balance', async () => {
      const initialBalance = 5000
      const account = await insertAccount({ user, balance: initialBalance })
      const category = await insertCategory({ user })
      const initialAmount = 10000
      const paymentPrincipal = 500
      const initialPending = roundNumber(initialAmount - paymentPrincipal) // 9500
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount, pendingAmount: initialPending })
      const loanId = loan._id.toString()

      const paymentAmount = 500
      const payment = await insertLoanPayment({
        loan: loanId,
        user,
        amount: paymentAmount,
        type: LOAN_PAYMENT.EXTRAORDINARY,
        principal: paymentPrincipal,
        interest: 0,
        accumulatedPrincipal: paymentPrincipal,
        pendingCapital: initialPending
      })

      await supertest(server.app)
        .delete(path(loanId, payment._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(204)

      // _recalcChain rebuilds from scratch: no payments → pendingAmount = initialAmount
      const updatedLoan = await LoanModel.findById(loanId).lean()
      expect(updatedLoan!.pendingAmount).toBe(initialAmount)

      // Account balance restored by +paymentAmount
      const updatedAccount = await AccountModel.findById(account._id).lean()
      expect(updatedAccount!.balance).toBe(roundNumber(initialBalance + paymentAmount))
    })
  })

  // ─── PUT /:id/payments/:paymentId ─────────────────────────────────────────
  describe('PUT /api/loans/:id/payments/:paymentId', () => {
    const path = (id: string, paymentId: string) => `/api/loans/${id}/payments/${paymentId}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35', '62a39498c4497e1fe3c2bf36')).expect(401)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .put(path('62a39498c4497e1fe3c2bf35', '62a39498c4497e1fe3c2bf36'))
        .auth(token, { type: 'bearer' })
        .send({ amount: 210 })
        .expect(404)
    })

    test('when body is empty (no editable fields), it should respond 422', async () => {
      const loan = await insertLoan({ user })
      const payment = await insertLoanPayment({ loan: loan._id.toString(), user })
      await supertest(server.app)
        .put(path(loan._id.toString(), payment._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({})
        .expect(422)
    })

    test('when payment does not exist, it should respond 404', async () => {
      const loan = await insertLoan({ user })
      await supertest(server.app)
        .put(path(loan._id.toString(), '62a39498c4497e1fe3c2bf36'))
        .auth(token, { type: 'bearer' })
        .send({ amount: 210 })
        .expect(404)
    })

    test('editing amount should recalculate pendingCapital chain, update loan.pendingAmount and update linked Transaction', async () => {
      const account = await insertAccount({ user, balance: 5000 })
      const category = await insertCategory({ user })
      const initialAmount = 10000
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount, pendingAmount: initialAmount })
      const loanId = loan._id.toString()

      const originalAmount = 200
      const originalDate = Date.now()
      const originalPrincipal = 175

      const payment = await insertLoanPayment({
        loan: loanId,
        user,
        amount: originalAmount,
        date: originalDate,
        principal: originalPrincipal,
        interest: 25,
        accumulatedPrincipal: originalPrincipal,
        pendingCapital: initialAmount - originalPrincipal,
        type: LOAN_PAYMENT.ORDINARY
      })

      // Create the linked transaction
      await TransactionModel.create({
        date: originalDate,
        category: category._id,
        amount: originalAmount,
        type: 'expense',
        account: account._id,
        user
      })

      const newAmount = 250

      const res = await supertest(server.app)
        .put(path(loanId, payment._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ amount: newAmount })
        .expect(200)

      expect(res.body.amount).toBe(newAmount)

      // loan.pendingAmount should be recalculated
      const updatedLoan = await LoanModel.findById(loanId).lean()
      expect(updatedLoan!.pendingAmount).toBeDefined()

      // linked transaction should be updated
      const tx = await TransactionModel.findOne({ user, account: account._id, date: originalDate })
      expect(tx!.amount).toBe(newAmount)
    })

    test('editing type from ORDINARY to EXTRAORDINARY should succeed and persist the new type', async () => {
      const loan = await insertLoan({ user })
      const loanId = loan._id.toString()
      const payment = await insertLoanPayment({ loan: loanId, user, type: LOAN_PAYMENT.ORDINARY })

      const res = await supertest(server.app)
        .put(path(loanId, payment._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ type: LOAN_PAYMENT.EXTRAORDINARY })
        .expect(200)

      expect(res.body.type).toBe(LOAN_PAYMENT.EXTRAORDINARY)

      const dbPayment = await LoanPaymentModel.findById(payment._id).lean()
      expect(dbPayment!.type).toBe(LOAN_PAYMENT.EXTRAORDINARY)
    })

    test('editing date should update the payment date and the linked transaction date', async () => {
      const account = await insertAccount({ user, balance: 5000 })
      const category = await insertCategory({ user })
      const loan = await insertLoan({ user, account: account._id, category: category._id, initialAmount: 10000, pendingAmount: 10000 })
      const loanId = loan._id.toString()
      const originalDate = new Date('2023-01-15').getTime()
      const newDate = new Date('2023-02-15').getTime()
      const paymentAmount = 200

      const payment = await insertLoanPayment({
        loan: loanId,
        user,
        date: originalDate,
        amount: paymentAmount,
        type: LOAN_PAYMENT.ORDINARY
      })

      // Linked transaction
      await TransactionModel.create({
        date: originalDate,
        category: category._id,
        amount: paymentAmount,
        type: 'expense',
        account: account._id,
        user
      })

      const res = await supertest(server.app)
        .put(path(loanId, payment._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ date: newDate })
        .expect(200)

      expect(res.body.date).toBe(newDate)

      const tx = await TransactionModel.findOne({ user, account: account._id, amount: paymentAmount })
      expect(tx!.date).toBe(newDate)
    })
  })

  // ─── POST /:id/simulate-payoff ────────────────────────────────────────────
  describe('POST /api/loans/:id/simulate-payoff', () => {
    const path = (id: string) => `/api/loans/${id}/simulate-payoff`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when id is not a valid ObjectId, it should respond 400', async () => {
      await supertest(server.app)
        .post(path('not-a-valid-id'))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: 100 })
        .expect(400)
    })

    test('when loan does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .post(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: 100 })
        .expect(404)
    })

    test('when loan belongs to another user, it should respond 404', async () => {
      const loan = await insertLoan()
      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: 100 })
        .expect(404)
    })

    test('when lumpSum is missing, it should respond 422', async () => {
      const loan = await insertLoan({ user })
      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({})
        .expect(422)
    })

    test('when lumpSum is negative, it should respond 422', async () => {
      const loan = await insertLoan({ user })
      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: -50 })
        .expect(422)
    })

    test('when lumpSum is 0, it should respond 422', async () => {
      const loan = await insertLoan({ user })
      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: 0 })
        .expect(422)
    })

    test('when lumpSum exceeds pendingAmount, it should respond 422', async () => {
      const loan = await insertLoan({ user, initialAmount: 10000, interestRate: 3, monthlyPayment: 200 })
      await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: 15000 })
        .expect(422)
    })

    test('when lumpSum is valid, it should return both options with correct structure', async () => {
      const loan = await insertLoan({ user, initialAmount: 10000, interestRate: 3, monthlyPayment: 200 })
      const res = await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: 2000 })
        .expect(200)

      expect(res.body.lumpSum).toBe(2000)
      expect(res.body.originalMonthsLeft).toBeGreaterThan(0)
      expect(res.body.originalMonthlyPayment).toBe(200)
      expect(res.body.originalEndDate).toBeGreaterThan(0)

      // Option A: reduce term
      expect(res.body.optionA.newMonthsLeft).toBeLessThan(res.body.originalMonthsLeft)
      expect(res.body.optionA.monthsSaved).toBeGreaterThan(0)
      expect(res.body.optionA.newMonthlyPayment).toBe(200)
      expect(res.body.optionA.monthlySaving).toBe(0)
      expect(res.body.optionA.totalInterestSaved).toBeGreaterThan(0)
      expect(res.body.optionA.newEndDate).toBeGreaterThan(0)

      // Option B: reduce quota
      expect(res.body.optionB.newMonthsLeft).toBe(res.body.originalMonthsLeft)
      expect(res.body.optionB.monthsSaved).toBe(0)
      expect(res.body.optionB.newMonthlyPayment).toBeLessThan(200)
      expect(res.body.optionB.monthlySaving).toBeGreaterThan(0)
      expect(res.body.optionB.totalInterestSaved).toBeGreaterThan(0)
      expect(res.body.optionB.newEndDate).toBeGreaterThan(0)
    })

    test('when lumpSum equals pendingAmount, option A should finish in 1 month', async () => {
      const loan = await insertLoan({ user, initialAmount: 10000, interestRate: 3, monthlyPayment: 200 })
      const res = await supertest(server.app)
        .post(path(loan._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: 10000 })
        .expect(200)

      expect(res.body.optionA.newMonthsLeft).toBeLessThanOrEqual(1)
      expect(res.body.optionA.totalInterestSaved).toBeGreaterThan(0)
    })

    test('when loan has events, they should be applied in the simulation', async () => {
      const loan = await insertLoan({ user, initialAmount: 10000, interestRate: 3, monthlyPayment: 200 })
      const loanId = loan._id.toString()

      await LoanEventModel.create({
        loan: loanId,
        date: Date.now() + 86400000 * 30,
        newRate: 5,
        newPayment: 250,
        user
      })

      const res = await supertest(server.app)
        .post(path(loanId))
        .auth(token, { type: 'bearer' })
        .send({ lumpSum: 2000 })
        .expect(200)

      expect(res.body.originalMonthsLeft).toBeGreaterThan(0)
      expect(res.body.optionA.newMonthsLeft).toBeLessThan(res.body.originalMonthsLeft)
      expect(res.body.optionB.newMonthlyPayment).toBeGreaterThan(0)
    })
  })
})
