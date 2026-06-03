import supertest from 'supertest'
import { faker } from '@faker-js/faker'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import testDatabase from '../../../../test/test-db'
import { mongoose, TRANSACTION } from '@soker90/finper-models'
import { transactionsRoutes } from '../transactions.routes'

const { transactions, accounts, categories, stores, users } = schema
const dbInstance = testDatabase(mongoose)

describe('Transactions Controller', () => {
  let token: string
  const username = generateUsername()
  const otherUsername = generateUsername()
  const path = '/test-api/transactions'
  const idPath = (id: string) => `${path}/${id}`

  let categoryId: string
  let accountId: string

  const insertAccount = (balance: number, user: string = username): string => {
    const id = generateId()
    sqliteDb.insert(accounts).values({ id, name: 'Acc', bank: 'Bank', balance, user }).run()
    return id
  }

  const balanceOf = (id: string): number =>
    sqliteDb.select().from(accounts).where(eq(accounts.id, id)).get()!.balance

  beforeAll(async () => {
    await dbInstance.connect()
    server.app.use('/test-api/transactions', transactionsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
    sqliteDb.insert(users).values({ id: 'tx-ctrl-other', username: otherUsername, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()

    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Food', type: 'expense', user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(stores).where(eq(stores.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, otherUsername)).run()
    sqliteDb.delete(users).where(eq(users.username, otherUsername)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
    await dbInstance.close()
  })

  beforeEach(() => {
    accountId = insertAccount(1000)
  })

  afterEach(() => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(transactions).where(eq(transactions.user, otherUsername)).run()
    sqliteDb.delete(stores).where(eq(stores.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, otherUsername)).run()
  })

  const validBody = (overrides: Record<string, any> = {}) => ({
    date: faker.date.past().getTime(),
    category: categoryId,
    amount: 10,
    type: TRANSACTION.Expense,
    account: accountId,
    ...overrides
  })

  describe('POST /', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('with no params responds 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['date', 'category', 'amount', 'type', 'account'])('without %s responds 422', async (param: string) => {
      const body: Record<string, any> = validBody()
      delete body[param]
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(body).expect(422)
    })

    test('tags are sanitized', async () => {
      const response = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody({ tags: [' Juan ', '#VIAJE-japon', 'juan'] })).expect(200)
      expect(response.body.tags).toEqual(['juan', 'viaje-japon'])
    })

    test('tags default to empty array', async () => {
      const response = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody()).expect(200)
      expect(response.body.tags).toEqual([])
    })

    test('more than 10 tags responds 422', async () => {
      const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody({ tags })).expect(422)
    })

    test('a tag longer than 30 chars responds 422', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody({ tags: ['a'.repeat(31)] })).expect(422)
    })

    test('account of another user responds 404', async () => {
      const otherAccount = insertAccount(0, otherUsername)
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody({ account: otherAccount })).expect(404)
    })

    test('success creating a transaction', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody()).expect(200)
    })

    test('same store name creates only one store', async () => {
      const storeName = 'My Unique Store'
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validBody({ store: storeName }))
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validBody({ store: storeName }))

      const storesInDb = sqliteDb.select().from(stores).where(eq(stores.user, username)).all()
      expect(storesInDb).toHaveLength(1)
    })

    test('creating an expense decreases the account balance', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody({ type: TRANSACTION.Expense, amount: 50 })).expect(200)
      expect(balanceOf(accountId)).toBeCloseTo(950, 2)
    })
  })

  describe('GET /', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('with no transactions returns empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('returns transactions populated', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validBody())
      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      expect(response.body[0].category._id).toBe(categoryId)
      expect(response.body[0].account._id).toBe(accountId)
      expect(response.body[0].account.bank).toBe('Bank')
    })
  })

  describe('PUT /:id', () => {
    const createOne = async () => {
      const res = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validBody())
      return res.body._id
    }

    test('without token responds 401', async () => {
      await supertest(server.app).put(idPath('any')).expect(401)
    })

    test('invalid id responds 400', async () => {
      await supertest(server.app).put(idPath('not-a-valid-id')).auth(token, { type: 'bearer' }).send(validBody()).expect(400)
    })

    test('non-existent transaction responds 404', async () => {
      await supertest(server.app).put(idPath('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .send(validBody()).expect(404)
    })

    test.each(['date', 'category', 'amount', 'type', 'account'])('without %s responds 422', async (param: string) => {
      const id = await createOne()
      const body: Record<string, any> = validBody()
      delete body[param]
      await supertest(server.app).put(idPath(id)).set('Authorization', `Bearer ${token}`).send(body).expect(422)
    })

    test('successfully edits a transaction', async () => {
      const id = await createOne()
      await supertest(server.app).put(idPath(id)).set('Authorization', `Bearer ${token}`)
        .send(validBody({ amount: 20, type: TRANSACTION.Income })).expect(200)
    })
  })

  describe('DELETE /:id', () => {
    const createOne = async () => {
      const res = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validBody())
      return res.body._id
    }

    test('without token responds 401', async () => {
      await supertest(server.app).delete(idPath('any')).expect(401)
    })

    test('non-existent transaction responds 404', async () => {
      await supertest(server.app).delete(idPath('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' }).expect(404)
    })

    test('transaction of another user responds 404', async () => {
      const otherAccount = insertAccount(0, otherUsername)
      const id = generateId()
      sqliteDb.insert(transactions).values({
        id, date: 1000, categoryId, amount: 10, type: TRANSACTION.Expense,
        accountId: otherAccount, note: null, storeId: null, subscriptionId: null, tags: [], user: otherUsername
      }).run()
      await supertest(server.app).delete(idPath(id)).set('Authorization', `Bearer ${token}`).expect(404)
    })

    test('deleting an existing transaction responds 204', async () => {
      const id = await createOne()
      await supertest(server.app).delete(idPath(id)).set('Authorization', `Bearer ${token}`).expect(204)
    })
  })
})
