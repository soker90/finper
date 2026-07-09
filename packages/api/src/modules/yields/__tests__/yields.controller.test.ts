import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId, TRANSACTION } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { ERROR_MESSAGE } from '../../../i18n'
import { yieldsRoutes } from '../yields.routes'

const { yields, transactions, categories, accounts, users } = schema

describe('Yields Controller', () => {
  let token: string
  const username = generateUsername()
  const path = '/test-api/yields'

  let categoryId: string
  let accountId: string

  const insertYield = (type: string = 'interest'): string => {
    const id = generateId()
    sqliteDb.insert(yields).values({ id, name: 'Test yield', type, accountId, categoryId, user: username }).run()
    return id
  }

  const insertTransaction = (params: { type: string, amount: number, yieldId?: string | null, date?: number, categoryId?: string }): string => {
    const id = generateId()
    sqliteDb.insert(transactions).values({
      id,
      date: params.date ?? Date.now(),
      categoryId: params.categoryId ?? categoryId,
      amount: params.amount,
      type: params.type,
      accountId,
      yieldId: params.yieldId ?? null,
      user: username
    }).run()
    return id
  }

  beforeAll(async () => {
    server.app.use('/test-api/yields', yieldsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)

    token = await requestLogin(server.app, { username })
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Cat', type: TRANSACTION.Income, user: username }).run()
    accountId = generateId()
    sqliteDb.insert(accounts).values({ id: accountId, name: 'A', bank: 'B', balance: 0, user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(yields).where(eq(yields.user, username)).run()
  })

  describe('POST /', () => {
    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when the type is not valid, it should respond 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'X', type: 'invalid', accountId, categoryId })
        .expect(422)
    })

    test('when the account does not exist, it should respond 404', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'X', type: 'interest', accountId: generateId(), categoryId })
        .expect(404)
    })

    test('when successful, it should create the yield', async () => {
      const res = await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'Intereses Cuenta Naranja', type: 'interest', accountId, categoryId })
        .expect(200)

      expect(res.body).toMatchObject({ name: 'Intereses Cuenta Naranja', type: 'interest', accountId, categoryId })
    })
  })

  describe('GET /', () => {
    test('when the yield has no linked transactions, stats should be zero', async () => {
      insertYield('interest')
      const res = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]).toMatchObject({ netAccumulated: 0, entriesCount: 0, paymentsCount: 0 })
    })

    test('interest: net = income - expense (bruto e impuesto enlazados)', async () => {
      const yieldId = insertYield('interest')
      insertTransaction({ type: TRANSACTION.Income, amount: 10, yieldId })
      insertTransaction({ type: TRANSACTION.Expense, amount: 2, yieldId })

      const res = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      const summary = res.body.find((y: any) => y._id === yieldId)
      expect(summary.netAccumulated).toBe(8)
      expect(summary.entriesCount).toBe(2)
      expect(summary.paymentsCount).toBe(1)
    })

    test('interest: a single net movement (no linked expense) is the net itself', async () => {
      const yieldId = insertYield('interest')
      insertTransaction({ type: TRANSACTION.Income, amount: 7.5, yieldId })

      const res = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      const summary = res.body.find((y: any) => y._id === yieldId)
      expect(summary.netAccumulated).toBe(7.5)
    })

    test('cashback: net = income only, linked expenses (recibos) are not subtracted', async () => {
      const yieldId = insertYield('cashback')
      insertTransaction({ type: TRANSACTION.Income, amount: 4, yieldId })
      insertTransaction({ type: TRANSACTION.Expense, amount: 80, yieldId })

      const res = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      const summary = res.body.find((y: any) => y._id === yieldId)
      expect(summary.netAccumulated).toBe(4)
      expect(summary.entriesCount).toBe(2)
      expect(summary.paymentsCount).toBe(1)
    })

    test('transactions linked to another yield should not count', async () => {
      const yieldId = insertYield('interest')
      const otherYieldId = insertYield('interest')
      insertTransaction({ type: TRANSACTION.Income, amount: 10, yieldId })
      insertTransaction({ type: TRANSACTION.Income, amount: 999, yieldId: otherYieldId })

      const res = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      const summary = res.body.find((y: any) => y._id === yieldId)
      expect(summary.netAccumulated).toBe(10)
    })
  })

  describe('GET /:id', () => {
    test('when the yield does not exist, it should respond 404', async () => {
      await supertest(server.app).get(`${path}/${generateId()}`).auth(token, { type: 'bearer' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.YIELD.NOT_FOUND)
        })
    })

    test('when the yield exists, it should return its linked entries', async () => {
      const yieldId = insertYield('interest')
      insertTransaction({ type: TRANSACTION.Income, amount: 10, yieldId })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.entries).toHaveLength(1)
    })

    test('interest: should return monthlyRows with grossIncome, taxExpense, and net', async () => {
      const yieldId = insertYield('interest')
      const dateJuly = new Date('2026-07-09T18:25:02').getTime()
      insertTransaction({ type: TRANSACTION.Income, amount: 100, yieldId, date: dateJuly })
      insertTransaction({ type: TRANSACTION.Expense, amount: 19, yieldId, date: dateJuly })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.monthlyRows).toHaveLength(1)
      expect(res.body.monthlyRows[0]).toMatchObject({
        month: '2026-07',
        grossIncome: 100,
        taxExpense: 19,
        net: 81
      })
      expect(res.body.netAccumulated).toBe(81)
    })

    test('cashback: should return monthlyRows with billsTotal, cashbackAmount, and percentage', async () => {
      const yieldId = insertYield('cashback')
      const dateJuly = new Date('2026-07-09T18:25:02').getTime()
      insertTransaction({ type: TRANSACTION.Income, amount: 3, yieldId, date: dateJuly })
      insertTransaction({ type: TRANSACTION.Expense, amount: 60, yieldId, date: dateJuly })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.monthlyRows).toHaveLength(1)
      expect(res.body.monthlyRows[0]).toMatchObject({
        month: '2026-07',
        billsTotal: 60,
        cashbackAmount: 3,
        percentage: 5
      })
      expect(res.body.netAccumulated).toBe(3)
    })

    test('cashback: should return percentage: null when billsTotal = 0', async () => {
      const yieldId = insertYield('cashback')
      const dateJuly = new Date('2026-07-09T18:25:02').getTime()
      insertTransaction({ type: TRANSACTION.Income, amount: 5, yieldId, date: dateJuly })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.monthlyRows).toHaveLength(1)
      expect(res.body.monthlyRows[0]).toMatchObject({
        month: '2026-07',
        billsTotal: 0,
        cashbackAmount: 5,
        percentage: null
      })
      expect(res.body.netAccumulated).toBe(5)
    })
  })

  describe('PUT /:id', () => {
    test('when the yield does not exist, it should respond 404', async () => {
      await supertest(server.app).put(`${path}/${generateId()}`).auth(token, { type: 'bearer' })
        .send({ name: 'X' })
        .expect(404)
    })

    test('when successful, it should update the name', async () => {
      const yieldId = insertYield('interest')
      const res = await supertest(server.app).put(`${path}/${yieldId}`).auth(token, { type: 'bearer' })
        .send({ name: 'Nuevo nombre' })
        .expect(200)
      expect(res.body.name).toBe('Nuevo nombre')
    })
  })

  describe('DELETE /:id', () => {
    test('when deleting a yield, its linked transactions should be unlinked, not deleted', async () => {
      const yieldId = insertYield('interest')
      const txId = insertTransaction({ type: TRANSACTION.Income, amount: 10, yieldId })

      await supertest(server.app).delete(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(204)

      const tx = sqliteDb.select().from(transactions).where(eq(transactions.id, txId)).get()
      expect(tx?.yieldId).toBeNull()
    })
  })

  describe('GET /:id/matching-transactions', () => {
    test('it should only return unlinked transactions of the same account and default category', async () => {
      const yieldId = insertYield('interest')
      const unlinkedId = insertTransaction({ type: TRANSACTION.Income, amount: 5 })

      const otherCatId = generateId()
      sqliteDb.insert(categories).values({ id: otherCatId, name: 'Other', type: TRANSACTION.Income, user: username }).run()
      insertTransaction({ type: TRANSACTION.Income, amount: 15, categoryId: otherCatId })

      const res = await supertest(server.app).get(`${path}/${yieldId}/matching-transactions`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]._id).toBe(unlinkedId)
    })

    test('it should filter by query param categoryId if provided', async () => {
      const yieldId = insertYield('interest')
      const otherCatId = generateId()
      sqliteDb.insert(categories).values({ id: otherCatId, name: 'Other', type: TRANSACTION.Income, user: username }).run()

      insertTransaction({ type: TRANSACTION.Income, amount: 5 })
      const txOtherCat = insertTransaction({ type: TRANSACTION.Income, amount: 15, categoryId: otherCatId })

      const res = await supertest(server.app)
        .get(`${path}/${yieldId}/matching-transactions`)
        .query({ categoryId: otherCatId })
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body).toHaveLength(1)
      expect(res.body[0]._id).toBe(txOtherCat)
    })
  })

  describe('POST /:id/link-transactions', () => {
    test('when transactionIds is empty, it should respond 422', async () => {
      const yieldId = insertYield('interest')
      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [] })
        .expect(422)
    })

    test('when successful, it should link both the payment and the tax transaction', async () => {
      const yieldId = insertYield('interest')
      const incomeId = insertTransaction({ type: TRANSACTION.Income, amount: 10 })
      const expenseId = insertTransaction({ type: TRANSACTION.Expense, amount: 2 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [incomeId, expenseId] })
        .expect(204)

      const linked = sqliteDb.select().from(transactions).where(eq(transactions.yieldId, yieldId)).all()
      expect(linked).toHaveLength(2)
    })
  })

  describe('DELETE /:id/unlink-transactions/:transactionId', () => {
    test('when successful, it should unlink the transaction', async () => {
      const yieldId = insertYield('interest')
      const txId = insertTransaction({ type: TRANSACTION.Income, amount: 10, yieldId })

      await supertest(server.app).delete(`${path}/${yieldId}/unlink-transactions/${txId}`).auth(token, { type: 'bearer' }).expect(204)

      const tx = sqliteDb.select().from(transactions).where(eq(transactions.id, txId)).get()
      expect(tx?.yieldId).toBeNull()
    })
  })
})
