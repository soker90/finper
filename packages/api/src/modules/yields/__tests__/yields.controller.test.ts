import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId, TRANSACTION } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { ERROR_MESSAGE } from '../../../i18n'
import { yieldsRoutes } from '../yields.routes'

const { yields, yieldSettlements, transactions, categories, accounts, users } = schema

describe('Yields Controller', () => {
  let token: string
  const username = generateUsername()
  const path = '/test-api/yields'

  let categoryId: string
  let accountId: string

  const insertYield = (type: string = 'interest'): string => {
    const id = generateId()
    sqliteDb.insert(yields).values({ id, name: 'Test yield', type, accountId, categoryIds: [categoryId], user: username }).run()
    return id
  }

  const insertTransaction = (params: { type: string, amount: number, yieldId?: string | null, yieldSettlementId?: string | null, date?: number, categoryId?: string }): string => {
    const id = generateId()
    sqliteDb.insert(transactions).values({
      id,
      date: params.date ?? Date.now(),
      categoryId: params.categoryId ?? categoryId,
      amount: params.amount,
      type: params.type,
      accountId,
      yieldId: params.yieldId ?? null,
      yieldSettlementId: params.yieldSettlementId ?? null,
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
    sqliteDb.delete(yieldSettlements).where(eq(yieldSettlements.user, username)).run()
    sqliteDb.delete(yields).where(eq(yields.user, username)).run()
  })

  describe('POST /', () => {
    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when the type is not valid, it should respond 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'X', type: 'invalid', accountId, categoryIds: [categoryId] })
        .expect(422)
    })

    test('when the account does not exist, it should respond 404', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'X', type: 'interest', accountId: generateId(), categoryIds: [categoryId] })
        .expect(404)
    })

    test('when duplicate yield (same account and type) is created, it should respond 422', async () => {
      insertYield('interest')
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'Intereses Cuenta Naranja 2', type: 'interest', accountId, categoryIds: [categoryId] })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.YIELD.ALREADY_EXISTS)
        })
    })

    test('when successful, it should create the yield', async () => {
      const res = await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'Intereses Cuenta Naranja', type: 'interest', accountId, categoryIds: [categoryId] })
        .expect(200)

      expect(res.body).toMatchObject({ name: 'Intereses Cuenta Naranja', type: 'interest', accountId, categoryIds: [categoryId] })
    })
  })

  describe('GET /', () => {
    test('when the yield has no linked transactions, stats should be zero', async () => {
      insertYield('interest')
      const res = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]).toMatchObject({ netAccumulated: 0, entriesCount: 0, paymentsCount: 0 })
    })

    test('interest: netAccumulated sum (income - expense)', async () => {
      const yieldId = insertYield('interest')
      const sId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: sId, yieldId, user: username }).run()

      insertTransaction({ type: TRANSACTION.Income, amount: 10, yieldId, yieldSettlementId: sId })
      insertTransaction({ type: TRANSACTION.Expense, amount: 2, yieldId, yieldSettlementId: sId })

      const res = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      const summary = res.body.find((y: any) => y._id === yieldId)
      expect(summary.netAccumulated).toBe(8)
      expect(summary.entriesCount).toBe(2)
      expect(summary.paymentsCount).toBe(1)
    })
  })

  describe('GET /:id', () => {
    test('interest: should return settlements with grossIncome, taxExpense, and net', async () => {
      const yieldId = insertYield('interest')
      const sId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: sId, yieldId, user: username }).run()

      insertTransaction({ type: TRANSACTION.Income, amount: 100, yieldId, yieldSettlementId: sId })
      insertTransaction({ type: TRANSACTION.Expense, amount: 19, yieldId, yieldSettlementId: sId })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements).toHaveLength(1)
      expect(res.body.settlements[0]).toMatchObject({
        id: sId,
        grossIncome: 100,
        taxExpense: 19,
        net: 81
      })
      expect(res.body.netAccumulated).toBe(81)
    })

    test('cashback: should return pending status when billsTotal > 0 and cashbackAmount = 0', async () => {
      const yieldId = insertYield('cashback')
      const sId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: sId, yieldId, user: username }).run()

      insertTransaction({ type: TRANSACTION.Expense, amount: 60, yieldId, yieldSettlementId: sId })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements).toHaveLength(1)
      expect(res.body.settlements[0]).toMatchObject({
        id: sId,
        billsTotal: 60,
        cashbackAmount: 0,
        percentage: null,
        status: 'pending'
      })
    })
  })

  describe('POST /:id/link-transactions', () => {
    test('when successful with new settlement and TAE/AverageBalance, should calculate balance', async () => {
      const yieldId = insertYield('interest')
      const incomeId = insertTransaction({ type: TRANSACTION.Income, amount: 100 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [incomeId], tae: 2.5 })
        .expect(204)

      const tx = sqliteDb.select().from(transactions).where(eq(transactions.id, incomeId)).get()
      expect(tx?.yieldSettlementId).not.toBeNull()

      const s = sqliteDb.select().from(yieldSettlements).where(eq(yieldSettlements.id, tx!.yieldSettlementId!)).get()
      expect(s?.tae).toBe(2.5)

      // Query detail to check calculations
      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements[0].averageBalance).toBeGreaterThan(0)
      expect(res.body.settlements[0].balanceSource).toBe('calculated')
    })

    test('when TAE is 0, averageBalance should remain null', async () => {
      const yieldId = insertYield('interest')
      const incomeId = insertTransaction({ type: TRANSACTION.Income, amount: 100 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [incomeId], tae: 0 })
        .expect(204)

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements[0].averageBalance).toBeNull()
      expect(res.body.settlements[0].balanceSource).toBeNull()
    })
  })

  describe('DELETE /:id/unlink-transactions/:transactionId', () => {
    test('unlinking the last transaction of a settlement should delete the settlement', async () => {
      const yieldId = insertYield('interest')
      const incomeId = insertTransaction({ type: TRANSACTION.Income, amount: 10 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [incomeId] })
        .expect(204)

      const txLinked = sqliteDb.select().from(transactions).where(eq(transactions.id, incomeId)).get()
      const sId = txLinked?.yieldSettlementId
      expect(sId).not.toBeNull()

      await supertest(server.app).delete(`${path}/${yieldId}/unlink-transactions/${incomeId}`).auth(token, { type: 'bearer' }).expect(204)

      const s = sqliteDb.select().from(yieldSettlements).where(eq(yieldSettlements.id, sId!)).get()
      expect(s).toBeUndefined()
    })
  })
})
