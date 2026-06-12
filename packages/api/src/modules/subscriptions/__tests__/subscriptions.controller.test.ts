import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { subscriptionsRoutes } from '../subscriptions.routes'

const { subscriptions, categories, accounts, users } = schema

describe('Subscriptions Controller', () => {
  let token: string
  const username = generateUsername()
  const path = '/test-api/subscriptions'
  const idPath = (id: string) => `${path}/${id}`

  let categoryId: string
  let accountId: string

  beforeAll(async () => {
    server.app.use('/test-api/subscriptions', subscriptionsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })

    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Streaming', type: 'expense', user: username }).run()
    accountId = generateId()
    sqliteDb.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(subscriptions).where(eq(subscriptions.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(subscriptions).where(eq(subscriptions.user, username)).run()
  })

  const validBody = (overrides: Record<string, any> = {}) => ({
    name: 'Netflix', amount: 9.99, cycle: 1, categoryId, accountId, ...overrides
  })

  describe('POST /', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('with no params responds 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['name', 'amount', 'cycle', 'categoryId', 'accountId'])('without %s responds 422', async (param: string) => {
      const body: Record<string, any> = validBody()
      delete body[param]
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(body).expect(422)
    })

    test('cycle out of range responds 422', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validBody({ cycle: 61 })).expect(422)
    })

    test('non-existent category responds 404', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody({ categoryId: '62a39498c4497e1fe3c2bf35' })).expect(404)
    })

    test('non-existent account responds 404', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody({ accountId: '62a39498c4497e1fe3c2bf35' })).expect(404)
    })

    test('success creating a subscription (raw shape, nextPaymentDate null)', async () => {
      const response = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
        .send(validBody()).expect(200)
      expect(response.body._id).toBeDefined()
      expect(response.body.nextPaymentDate).toBeNull()
      expect(response.body.categoryId).toBe(categoryId)
    })
  })

  describe('GET /', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('with no subscriptions returns empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('returns populated subscriptions', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validBody())
      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      expect(response.body[0].categoryId).toEqual({ _id: categoryId, name: 'Streaming' })
      expect(response.body[0].accountId).toEqual({ _id: accountId, name: 'Checking', bank: 'BankA' })
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

    test('non-existent subscription responds 404', async () => {
      await supertest(server.app).put(idPath('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' }).send({ name: 'X' }).expect(404)
    })

    test('cycle out of range responds 422', async () => {
      const id = await createOne()
      await supertest(server.app).put(idPath(id)).set('Authorization', `Bearer ${token}`).send({ cycle: 0 }).expect(422)
    })

    test('successfully edits a subscription', async () => {
      const id = await createOne()
      const response = await supertest(server.app).put(idPath(id)).set('Authorization', `Bearer ${token}`).send({ name: 'HBO Max' }).expect(200)
      expect(response.body.name).toBe('HBO Max')
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

    test('non-existent subscription responds 404', async () => {
      await supertest(server.app).delete(idPath('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' }).expect(404)
    })

    test('deleting an existing subscription responds 204', async () => {
      const id = await createOne()
      await supertest(server.app).delete(idPath(id)).set('Authorization', `Bearer ${token}`).expect(204)
    })
  })
})
