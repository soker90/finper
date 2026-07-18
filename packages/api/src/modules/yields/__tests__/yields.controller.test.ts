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
    sqliteDb.insert(yields).values({ id, type, accountId, categoryIds: [categoryId], user: username }).run()
    return id
  }

  const insertTransaction = (params: { type: string, amount: number, yieldId?: string | null, yieldSettlementId?: string | null, date?: number, categoryId?: string, note?: string }): string => {
    const id = generateId()
    sqliteDb.insert(transactions).values({
      id,
      date: params.date ?? Date.now(),
      categoryId: params.categoryId ?? categoryId,
      amount: params.amount,
      type: params.type,
      accountId,
      note: params.note ?? null,
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
        .send({ type: 'invalid', accountId, categoryIds: [categoryId] })
        .expect(422)
    })

    test('when the account does not exist, it should respond 404', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ type: 'interest', accountId: generateId(), categoryIds: [categoryId] })
        .expect(404)
    })

    test('when duplicate yield (same account and type) is created, it should respond 422', async () => {
      insertYield('interest')
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ type: 'interest', accountId, categoryIds: [categoryId] })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.YIELD.ALREADY_EXISTS)
        })
    })

    test('when successful, it should create the yield', async () => {
      const res = await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ type: 'interest', accountId, categoryIds: [categoryId] })
        .expect(200)

      expect(res.body).toMatchObject({ type: 'interest', accountId, categoryIds: [categoryId] })
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
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      insertTransaction({ type: TRANSACTION.Income, amount: 10, yieldId, yieldSettlementId: settlementId })
      insertTransaction({ type: TRANSACTION.Expense, amount: 2, yieldId, yieldSettlementId: settlementId })

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
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      insertTransaction({ type: TRANSACTION.Income, amount: 100, yieldId, yieldSettlementId: settlementId })
      insertTransaction({ type: TRANSACTION.Expense, amount: 19, yieldId, yieldSettlementId: settlementId })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements).toHaveLength(1)
      expect(res.body.settlements[0]).toMatchObject({
        id: settlementId,
        grossIncome: 100,
        taxExpense: 19,
        net: 81
      })
      expect(res.body.netAccumulated).toBe(81)
    })

    test('interest: should return warning no_income and exact net when only an expense transaction is linked', async () => {
      const yieldId = insertYield('interest')
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      const txDate = new Date('2026-03-15').getTime()
      insertTransaction({ type: TRANSACTION.Expense, amount: 25.5, yieldId, yieldSettlementId: settlementId, date: txDate })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements).toHaveLength(1)
      expect(res.body.settlements[0]).toMatchObject({
        id: settlementId,
        grossIncome: 0,
        taxExpense: 25.5,
        net: -25.5,
        settlementDate: txDate,
        warning: 'no_income'
      })
      expect(res.body.netAccumulated).toBe(-25.5)
    })

    test('cashback: should return pending status when billsTotal > 0 and cashbackAmount = 0', async () => {
      const yieldId = insertYield('cashback')
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      insertTransaction({ type: TRANSACTION.Expense, amount: 60, yieldId, yieldSettlementId: settlementId })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements).toHaveLength(1)
      expect(res.body.settlements[0]).toMatchObject({
        id: settlementId,
        billsTotal: 60,
        cashbackAmount: 0,
        percentage: null,
        status: 'pending'
      })
    })

    test('cashback: should sum all expenses as billsTotal and incomes as cashbackAmount', async () => {
      const yieldId = insertYield('cashback')
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      insertTransaction({ type: TRANSACTION.Expense, amount: 100, yieldId, yieldSettlementId: settlementId })
      insertTransaction({ type: TRANSACTION.Income, amount: 5, yieldId, yieldSettlementId: settlementId })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements).toHaveLength(1)
      expect(res.body.settlements[0]).toMatchObject({
        id: settlementId,
        billsTotal: 100,
        cashbackAmount: 5,
        net: 5,
        percentage: 5,
        status: 'completed'
      })
    })

    test('settlementDate equals the income transaction date when there is an income entry', async () => {
      const yieldId = insertYield('interest')
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      const incomeDate = new Date('2026-03-12').getTime()
      insertTransaction({ type: TRANSACTION.Income, amount: 100, yieldId, yieldSettlementId: settlementId, date: incomeDate })
      insertTransaction({ type: TRANSACTION.Expense, amount: 19, yieldId, yieldSettlementId: settlementId })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements[0].settlementDate).toBe(incomeDate)
    })

    test('settlementDate is null when settlement has only expense transactions', async () => {
      const yieldId = insertYield('cashback')
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      insertTransaction({ type: TRANSACTION.Expense, amount: 60, yieldId, yieldSettlementId: settlementId })

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.settlements[0].settlementDate).toBeNull()
    })

    test('settlements are sorted: pending (null) first, then most recent settlementDate first', async () => {
      const yieldId = insertYield('interest')

      const oldSettlementId = generateId()
      const newSettlementId = generateId()
      const pendingSettlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: oldSettlementId, yieldId, user: username }).run()
      sqliteDb.insert(yieldSettlements).values({ id: newSettlementId, yieldId, user: username }).run()
      sqliteDb.insert(yieldSettlements).values({ id: pendingSettlementId, yieldId, user: username }).run()

      const oldDate = new Date('2025-01-10').getTime()
      const newDate = new Date('2026-07-01').getTime()
      insertTransaction({ type: TRANSACTION.Income, amount: 50, yieldId, yieldSettlementId: oldSettlementId, date: oldDate })
      insertTransaction({ type: TRANSACTION.Income, amount: 80, yieldId, yieldSettlementId: newSettlementId, date: newDate })
      // pendingSettlement has no income → settlementDate null

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      const settlementIds = res.body.settlements.map((s: any) => s.id)
      expect(settlementIds[0]).toBe(pendingSettlementId)
      expect(settlementIds[1]).toBe(newSettlementId)
      expect(settlementIds[2]).toBe(oldSettlementId)
    })
  })

  describe('GET /:id/matching-transactions', () => {
    test('returns only unlinked transactions matching all yield categories', async () => {
      const categoryId2 = generateId()
      sqliteDb.insert(categories).values({ id: categoryId2, name: 'Cat2', type: TRANSACTION.Income, user: username }).run()

      const yieldId = generateId()
      sqliteDb.insert(yields).values({ id: yieldId, type: 'interest', accountId, categoryIds: [categoryId, categoryId2], user: username }).run()

      const unlinkedTx1 = insertTransaction({ type: TRANSACTION.Income, amount: 10, categoryId })
      const unlinkedTx2 = insertTransaction({ type: TRANSACTION.Income, amount: 20, categoryId: categoryId2 })
      const linkedSettlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: linkedSettlementId, yieldId, user: username }).run()
      const linkedTxId = insertTransaction({ type: TRANSACTION.Income, amount: 5, categoryId, yieldId, yieldSettlementId: linkedSettlementId })

      const res = await supertest(server.app)
        .get(`${path}/${yieldId}/matching-transactions`)
        .auth(token, { type: 'bearer' })
        .expect(200)

      const returnedIds = res.body.map((t: any) => t._id)
      expect(returnedIds).toContain(unlinkedTx1)
      expect(returnedIds).toContain(unlinkedTx2)
      expect(returnedIds).not.toContain(linkedTxId)
    })

    test('categoryId narrows results to a single one of the yield categories', async () => {
      const categoryId2 = generateId()
      sqliteDb.insert(categories).values({ id: categoryId2, name: 'Cat2', type: TRANSACTION.Income, user: username }).run()

      const yieldId = generateId()
      sqliteDb.insert(yields).values({ id: yieldId, type: 'interest', accountId, categoryIds: [categoryId, categoryId2], user: username }).run()

      const tx1 = insertTransaction({ type: TRANSACTION.Income, amount: 10, categoryId })
      const tx2 = insertTransaction({ type: TRANSACTION.Income, amount: 20, categoryId: categoryId2 })

      const res = await supertest(server.app)
        .get(`${path}/${yieldId}/matching-transactions`)
        .query({ categoryId: categoryId2 })
        .auth(token, { type: 'bearer' })
        .expect(200)

      const returnedIds = res.body.map((t: any) => t._id)
      expect(returnedIds).toContain(tx2)
      expect(returnedIds).not.toContain(tx1)
    })

    test('ignores a categoryId that does not belong to this yield', async () => {
      const foreignCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: foreignCategoryId, name: 'Foreign', type: TRANSACTION.Income, user: username }).run()

      const yieldId = insertYield('interest')
      const tx1 = insertTransaction({ type: TRANSACTION.Income, amount: 10 })

      const res = await supertest(server.app)
        .get(`${path}/${yieldId}/matching-transactions`)
        .query({ categoryId: foreignCategoryId })
        .auth(token, { type: 'bearer' })
        .expect(200)

      const returnedIds = res.body.map((t: any) => t._id)
      expect(returnedIds).toContain(tx1)
    })

    test('dateFrom/dateTo narrow results by date, letting older matches past the 50-item cap be found', async () => {
      const yieldId = insertYield('interest')
      const oldTx = insertTransaction({ type: TRANSACTION.Income, amount: 10, date: new Date('2025-01-01').getTime() })
      const recentTx = insertTransaction({ type: TRANSACTION.Income, amount: 20, date: new Date('2026-06-01').getTime() })

      const res = await supertest(server.app)
        .get(`${path}/${yieldId}/matching-transactions`)
        .query({ dateFrom: new Date('2024-12-01').getTime(), dateTo: new Date('2025-02-01').getTime() })
        .auth(token, { type: 'bearer' })
        .expect(200)

      const returnedIds = res.body.map((t: any) => t._id)
      expect(returnedIds).toContain(oldTx)
      expect(returnedIds).not.toContain(recentTx)
    })
  })

  describe('POST /:id/link-transactions', () => {
    test('when successful with new settlement and TAE/AverageBalance, should calculate balance', async () => {
      const yieldId = insertYield('interest')
      const incomeId = insertTransaction({ type: TRANSACTION.Income, amount: 100 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [incomeId], tae: 2.5 })
        .expect(204)

      const linkedTx = sqliteDb.select().from(transactions).where(eq(transactions.id, incomeId)).get()
      expect(linkedTx?.yieldSettlementId).not.toBeNull()

      const settlement = sqliteDb.select().from(yieldSettlements).where(eq(yieldSettlements.id, linkedTx!.yieldSettlementId!)).get()
      expect(settlement?.tae).toBe(2.5)

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

    test('given only averageBalance (no TAE), should calculate TAE automatically', async () => {
      const yieldId = insertYield('interest')
      const incomeId = insertTransaction({ type: TRANSACTION.Income, amount: 100 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [incomeId], averageBalance: 40000 })
        .expect(204)

      const res = await supertest(server.app).get(`${path}/${yieldId}`).auth(token, { type: 'bearer' }).expect(200)
      const resultSettlement = res.body.settlements[0]
      expect(resultSettlement.tae).toBeGreaterThan(0)
      expect(resultSettlement.taeSource).toBe('calculated')
      expect(resultSettlement.averageBalance).toBe(40000)
      expect(resultSettlement.balanceSource).toBe('provided')
    })

    test('links transactions to an existing settlement without creating a new one', async () => {
      const yieldId = insertYield('interest')
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      const txId = insertTransaction({ type: TRANSACTION.Income, amount: 50 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [txId], settlementId })
        .expect(204)

      const linkedTx = sqliteDb.select().from(transactions).where(eq(transactions.id, txId)).get()
      expect(linkedTx?.yieldSettlementId).toBe(settlementId)

      const allSettlements = sqliteDb.select().from(yieldSettlements).where(eq(yieldSettlements.yieldId, yieldId)).all()
      expect(allSettlements).toHaveLength(1)
    })

    test('returns 404 when the provided settlementId does not belong to this yield', async () => {
      const yieldId = insertYield('interest')
      const otherYieldId = generateId()
      sqliteDb.insert(yields).values({ id: otherYieldId, type: 'cashback', accountId, categoryIds: [categoryId], user: username }).run()

      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId: otherYieldId, user: username }).run()

      const txId = insertTransaction({ type: TRANSACTION.Income, amount: 50 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [txId], settlementId })
        .expect(404)
    })
  })

  describe('PUT /:id/settlements/:settlementId', () => {
    test('edits TAE and averageBalance and returns the updated settlement', async () => {
      const yieldId = insertYield('interest')
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()

      const res = await supertest(server.app)
        .put(`${path}/${yieldId}/settlements/${settlementId}`)
        .auth(token, { type: 'bearer' })
        .send({ tae: 3.5, averageBalance: 50000 })
        .expect(200)

      expect(res.body).toMatchObject({ tae: 3.5, averageBalance: 50000 })

      const updatedRecord = sqliteDb.select().from(yieldSettlements).where(eq(yieldSettlements.id, settlementId)).get()
      expect(updatedRecord?.tae).toBe(3.5)
      expect(updatedRecord?.averageBalance).toBe(50000)
    })

    test('returns 404 when the settlementId does not belong to this yield', async () => {
      const yieldId = insertYield('interest')
      const otherYieldId = generateId()
      sqliteDb.insert(yields).values({ id: otherYieldId, type: 'cashback', accountId, categoryIds: [categoryId], user: username }).run()

      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId: otherYieldId, user: username }).run()

      await supertest(server.app)
        .put(`${path}/${yieldId}/settlements/${settlementId}`)
        .auth(token, { type: 'bearer' })
        .send({ tae: 1.0 })
        .expect(404)
    })
  })

  describe('DELETE /:id/settlements/:settlementId', () => {
    test('unlinks every transaction of the settlement and deletes it', async () => {
      const yieldId = insertYield('interest')
      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId, user: username }).run()
      const tx1 = insertTransaction({ type: TRANSACTION.Income, amount: 10, yieldId, yieldSettlementId: settlementId })
      const tx2 = insertTransaction({ type: TRANSACTION.Expense, amount: 2, yieldId, yieldSettlementId: settlementId })

      await supertest(server.app)
        .delete(`${path}/${yieldId}/settlements/${settlementId}`)
        .auth(token, { type: 'bearer' })
        .expect(204)

      const remainingSettlement = sqliteDb.select().from(yieldSettlements).where(eq(yieldSettlements.id, settlementId)).get()
      expect(remainingSettlement).toBeUndefined()

      const updatedTx1 = sqliteDb.select().from(transactions).where(eq(transactions.id, tx1)).get()
      const updatedTx2 = sqliteDb.select().from(transactions).where(eq(transactions.id, tx2)).get()
      expect(updatedTx1?.yieldId).toBeNull()
      expect(updatedTx1?.yieldSettlementId).toBeNull()
      expect(updatedTx2?.yieldId).toBeNull()
      expect(updatedTx2?.yieldSettlementId).toBeNull()
    })

    test('returns 404 when the settlementId does not belong to this yield', async () => {
      const yieldId = insertYield('interest')
      const otherYieldId = generateId()
      sqliteDb.insert(yields).values({ id: otherYieldId, type: 'cashback', accountId, categoryIds: [categoryId], user: username }).run()

      const settlementId = generateId()
      sqliteDb.insert(yieldSettlements).values({ id: settlementId, yieldId: otherYieldId, user: username }).run()

      await supertest(server.app)
        .delete(`${path}/${yieldId}/settlements/${settlementId}`)
        .auth(token, { type: 'bearer' })
        .expect(404)
    })
  })

  describe('DELETE /:id/unlink-transactions/:transactionId', () => {
    test('unlinking the last transaction of a settlement should delete the settlement', async () => {
      const yieldId = insertYield('interest')
      const incomeId = insertTransaction({ type: TRANSACTION.Income, amount: 10 })

      await supertest(server.app).post(`${path}/${yieldId}/link-transactions`).auth(token, { type: 'bearer' })
        .send({ transactionIds: [incomeId] })
        .expect(204)

      const linkedTx = sqliteDb.select().from(transactions).where(eq(transactions.id, incomeId)).get()
      const settlementId = linkedTx?.yieldSettlementId
      expect(settlementId).not.toBeNull()

      await supertest(server.app).delete(`${path}/${yieldId}/unlink-transactions/${incomeId}`).auth(token, { type: 'bearer' }).expect(204)

      const deletedSettlement = sqliteDb.select().from(yieldSettlements).where(eq(yieldSettlements.id, settlementId!)).get()
      expect(deletedSettlement).toBeUndefined()
    })
  })
})
