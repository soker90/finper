import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId, TRANSACTION } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { statsRoutes } from '../stats.routes'

const { transactions, categories, accounts, users, transactionSplits } = schema

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
    sqliteDb.delete(transactionSplits).where(eq(transactionSplits.user, username)).run()
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

    test('ignores tags from income and not_computable transactions', async () => {
      insertTx({ tags: ['salario'], type: TRANSACTION.Income })
      insertTx({ tags: ['transf'], type: TRANSACTION.NotComputable })
      const res = await supertest(server.app).get(`${base}/tags/available`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toEqual([])
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

    test('excludes years from untagged transactions', async () => {
      insertTx({ date: Date.UTC(2024, 5, 15), tags: [] })
      const res = await supertest(server.app).get(`${base}/tags/years`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toEqual([])
    })
  })

  describe('GET /tags', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(`${base}/tags`).expect(401)
    })

    test('returns summary filtered by year query with totals and byCategory', async () => {
      insertTx({ amount: 100, tags: ['viaje'], date: Date.UTC(2024, 5, 15) })
      insertTx({ amount: 100, tags: ['juan'], date: Date.UTC(2025, 5, 15) })
      insertTx({ amount: 200, tags: ['juan'], date: Date.UTC(2025, 5, 16) })
      const res = await supertest(server.app).get(`${base}/tags?year=2025`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].tag).toBe('juan')
      expect(res.body[0].totalAmount).toBe(300)
      expect(res.body[0].transactionCount).toBe(2)
      expect(res.body[0].byCategory).toHaveLength(1)
      expect(res.body[0].byCategory[0].categoryName).toBe('Comida')
      expect(res.body[0].byCategory[0].amount).toBe(300)
    })

    test('excludes income and not_computable transactions', async () => {
      insertTx({ tags: ['salario'], type: TRANSACTION.Income, date: Date.UTC(2025, 5, 15) })
      insertTx({ tags: ['transf'], type: TRANSACTION.NotComputable, date: Date.UTC(2025, 5, 15) })
      const res = await supertest(server.app).get(`${base}/tags?year=2025`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body).toHaveLength(0)
    })

    test('includes split-line tags without double-counting the parent amount', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar', type: 'expense', user: username }).run()
      const transactionId = generateId()
      sqliteDb.insert(transactions).values({
        id: transactionId,
        date: Date.UTC(2025, 5, 15),
        categoryId,
        amount: 100,
        type: TRANSACTION.Expense,
        accountId,
        note: null,
        storeId: null,
        tags: [],
        user: username
      }).run()
      sqliteDb.insert(transactionSplits).values([
        { id: generateId(), transactionId, categoryId, amount: 65, tags: ['comida'], user: username },
        { id: generateId(), transactionId, categoryId: homeCategoryId, amount: 35, tags: ['hogar'], user: username }
      ]).run()

      const res = await supertest(server.app).get(`${base}/tags?year=2025`).auth(token, { type: 'bearer' }).expect(200)
      const byTag = Object.fromEntries(res.body.map((row: any) => [row.tag, row]))
      expect(byTag.carrefour).toBeUndefined()
      expect(byTag.comida.totalAmount).toBe(65)
      expect(byTag.comida.transactionCount).toBe(1)
      expect(byTag.hogar.totalAmount).toBe(35)
    })

    test('sorts tags by totalAmount desc', async () => {
      insertTx({ amount: 50, tags: ['small'], date: Date.UTC(2025, 1, 1) })
      insertTx({ amount: 500, tags: ['big'], date: Date.UTC(2025, 1, 1) })
      const res = await supertest(server.app).get(`${base}/tags?year=2025`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.map((s: any) => s.tag)).toEqual(['big', 'small'])
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
    test('returns detail for the year with byCategory and populated transactions', async () => {
      insertTx({ amount: 150, tags: ['viaje-japon'], date: Date.UTC(2025, 5, 15) })
      const res = await supertest(server.app).get(`${base}/tags/viaje-japon/2025`).auth(token, { type: 'bearer' }).expect(200)
      expect(res.body.tag).toBe('viaje-japon')
      expect(res.body.year).toBe(2025)
      expect(res.body.totalAmount).toBe(150)
      expect(res.body.transactionCount).toBe(1)
      expect(res.body.byCategory).toHaveLength(1)
      expect(res.body.byCategory[0].categoryName).toBe('Comida')
      expect(res.body.transactions).toHaveLength(1)
      expect(res.body.transactions[0].category).toEqual({ _id: categoryId, name: 'Comida' })
    })

    test('non-numeric year responds 422', async () => {
      await supertest(server.app).get(`${base}/tags/juan/notanumber`).auth(token, { type: 'bearer' }).expect(422)
    })

    test('year below 1900 responds 422', async () => {
      await supertest(server.app).get(`${base}/tags/juan/1899`).auth(token, { type: 'bearer' }).expect(422)
    })

    test('a split transaction with two lines sharing the tag appears as two entries with distinct ids', async () => {
      const hogarId = generateId()
      sqliteDb.insert(categories).values({ id: hogarId, name: 'Hogar Split Detail', type: 'expense', user: username }).run()
      const txId = generateId()
      sqliteDb.insert(transactions).values({
        id: txId,
        date: Date.UTC(2025, 5, 15),
        categoryId,
        amount: 100,
        type: TRANSACTION.Expense,
        accountId,
        note: null,
        storeId: null,
        tags: [],
        user: username
      }).run()
      sqliteDb.insert(transactionSplits).values([
        { id: generateId(), transactionId: txId, categoryId, amount: 60, tags: ['viaje'], user: username },
        { id: generateId(), transactionId: txId, categoryId: hogarId, amount: 40, tags: ['viaje'], user: username }
      ]).run()

      const res = await supertest(server.app).get(`${base}/tags/viaje/2025`).auth(token, { type: 'bearer' }).expect(200)

      // One real transaction, but two split lines both carry the tag: the
      // count reflects the transaction, the list shows both lines (they
      // usually differ in category/amount) with unique ids.
      expect(res.body.transactionCount).toBe(1)
      expect(res.body.totalAmount).toBe(100)
      expect(res.body.transactions).toHaveLength(2)
      const ids = res.body.transactions.map((transaction: any) => transaction._id)
      expect(new Set(ids).size).toBe(2)
      expect(res.body.transactions.map((transaction: any) => transaction.amount).sort()).toEqual([40, 60])
    })

    test('split transaction with same tag across lines does not inflate transactionCount in summary or category breakdown', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar Super', type: 'expense', user: username }).run()
      const transactionId = generateId()
      sqliteDb.insert(transactions).values({
        id: transactionId,
        date: Date.UTC(2025, 5, 15),
        categoryId,
        amount: 100,
        type: TRANSACTION.Expense,
        accountId,
        note: null,
        storeId: null,
        tags: [],
        user: username
      }).run()
      sqliteDb.insert(transactionSplits).values([
        { id: generateId(), transactionId, categoryId, amount: 60, tags: ['supermercado'], user: username },
        { id: generateId(), transactionId, categoryId: homeCategoryId, amount: 40, tags: ['supermercado'], user: username }
      ]).run()

      const summaryResponse = await supertest(server.app).get(`${base}/tags?year=2025`).auth(token, { type: 'bearer' }).expect(200)
      const targetSummary = summaryResponse.body.find((item: any) => item.tag === 'supermercado')
      expect(targetSummary).toBeDefined()
      expect(targetSummary.totalAmount).toBe(100)
      expect(targetSummary.transactionCount).toBe(1)
      expect(targetSummary.byCategory).toHaveLength(2)
      expect(targetSummary.byCategory.every((categoryItem: any) => categoryItem.count === 1)).toBe(true)

      const detailResponse = await supertest(server.app).get(`${base}/tags/supermercado/2025`).auth(token, { type: 'bearer' }).expect(200)
      expect(detailResponse.body.totalAmount).toBe(100)
      expect(detailResponse.body.transactionCount).toBe(1)
      expect(detailResponse.body.byCategory.every((categoryItem: any) => categoryItem.count === 1)).toBe(true)
      expect(detailResponse.body.transactions).toHaveLength(2)
    })

    test('split transaction with different tags isolates amounts and counts per tag', async () => {
      const pharmacyCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: pharmacyCategoryId, name: 'Farmacia', type: 'expense', user: username }).run()
      const transactionId = generateId()
      sqliteDb.insert(transactions).values({
        id: transactionId,
        date: Date.UTC(2025, 5, 20),
        categoryId,
        amount: 100,
        type: TRANSACTION.Expense,
        accountId,
        note: null,
        storeId: null,
        tags: [],
        user: username
      }).run()
      sqliteDb.insert(transactionSplits).values([
        { id: generateId(), transactionId, categoryId, amount: 70, tags: ['comida-rapida'], user: username },
        { id: generateId(), transactionId, categoryId: pharmacyCategoryId, amount: 30, tags: ['salud'], user: username }
      ]).run()

      const summaryResponse = await supertest(server.app).get(`${base}/tags?year=2025`).auth(token, { type: 'bearer' }).expect(200)
      const summaryByTag = Object.fromEntries(summaryResponse.body.map((item: any) => [item.tag, item]))

      expect(summaryByTag['comida-rapida'].totalAmount).toBe(70)
      expect(summaryByTag['comida-rapida'].transactionCount).toBe(1)
      expect(summaryByTag['comida-rapida'].byCategory[0].categoryName).toBe('Comida')

      expect(summaryByTag.salud.totalAmount).toBe(30)
      expect(summaryByTag.salud.transactionCount).toBe(1)
      expect(summaryByTag.salud.byCategory[0].categoryName).toBe('Farmacia')
    })

    test('split transaction with same category across lines sums amounts correctly in category breakdown', async () => {
      const transactionId = generateId()
      sqliteDb.insert(transactions).values({
        id: transactionId,
        date: Date.UTC(2025, 5, 25),
        categoryId,
        amount: 100,
        type: TRANSACTION.Expense,
        accountId,
        note: null,
        storeId: null,
        tags: [],
        user: username
      }).run()
      sqliteDb.insert(transactionSplits).values([
        { id: generateId(), transactionId, categoryId, amount: 60, tags: ['finde'], user: username },
        { id: generateId(), transactionId, categoryId, amount: 40, tags: ['finde'], user: username }
      ]).run()

      const summaryResponse = await supertest(server.app).get(`${base}/tags?year=2025`).auth(token, { type: 'bearer' }).expect(200)
      const targetSummary = summaryResponse.body.find((item: any) => item.tag === 'finde')
      expect(targetSummary).toBeDefined()
      expect(targetSummary.totalAmount).toBe(100)
      expect(targetSummary.transactionCount).toBe(1)
      expect(targetSummary.byCategory).toHaveLength(1)
      expect(targetSummary.byCategory[0].categoryName).toBe('Comida')
      expect(targetSummary.byCategory[0].amount).toBe(100)
      expect(targetSummary.byCategory[0].count).toBe(1)

      const detailResponse = await supertest(server.app).get(`${base}/tags/finde/2025`).auth(token, { type: 'bearer' }).expect(200)
      expect(detailResponse.body.totalAmount).toBe(100)
      expect(detailResponse.body.transactionCount).toBe(1)
      expect(detailResponse.body.byCategory).toHaveLength(1)
      expect(detailResponse.body.byCategory[0].amount).toBe(100)
      expect(detailResponse.body.byCategory[0].count).toBe(1)
      expect(detailResponse.body.transactions).toHaveLength(2)
      expect(new Set(detailResponse.body.transactions.map((transaction: any) => transaction._id)).size).toBe(2)
    })
  })
})
