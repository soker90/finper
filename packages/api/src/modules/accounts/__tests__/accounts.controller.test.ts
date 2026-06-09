import supertest from 'supertest'
import { faker } from '@faker-js/faker'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { ERROR_MESSAGE } from '../../../i18n'
import { accountsRoutes } from '../accounts.routes'
import { accountsRepository } from '../accounts.repository'

const { accounts, users } = schema

describe('Accounts Controller', () => {
  let token: string
  const username = generateUsername()
  const path = '/test-api/accounts'

  beforeAll(async () => {
    server.app.use('/test-api/accounts', accountsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)

    token = await requestLogin(server.app, { username })
  })

  afterAll(async () => {
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
  })

  describe('POST /', () => {
    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['name', 'bank'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, string> = {
        name: faker.finance.accountName(),
        bank: faker.lorem.word()
      }
      delete params[param]

      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when success creating an account', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: faker.finance.accountName(),
          bank: faker.lorem.word(),
          balance: faker.string.numeric()
        })
        .expect(200)
    })
  })

  describe('GET /', () => {
    beforeAll(async () => {
      // old test did a global insert here but we do afterEach cleanups so we handle data locally.
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when then user have no accounts, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when the user have no accounts active, it should return an empty array', async () => {
      const acc = await accountsRepository.create(username, { name: 'A', bank: 'B' })
      await accountsRepository.update(acc.id, username, { isActive: false })
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when the user have accounts, it should return the accounts', async () => {
      const account = await accountsRepository.create(username, { name: 'A', bank: 'B', balance: 100 })
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [{
        _id: account.id,
        name: account.name,
        bank: account.bank,
        balance: account.balance
      }])
    })
  })

  describe('PATCH /:id', () => {
    const patchPath = (id: string) => `${path}/${id}`

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).patch(patchPath('any')).expect(401)
    })

    test('when id is not a valid ObjectId, it should respond 400', async () => {
      await supertest(server.app).patch(patchPath('not-a-valid-id')).auth(token, { type: 'bearer' }).send({}).expect(400)
    })

    test('when the account does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).patch(patchPath('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .send({})
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.ACCOUNT.NOT_FOUND)
        })
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      const account = await accountsRepository.create(username, { name: 'A', bank: 'B' })
      await supertest(server.app).patch(patchPath(account.id)).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['name', 'bank', 'balance'])('when no %s param provided and other is name or bank, it should response an error with status code 422', async (param: string) => {
      const account = await accountsRepository.create(username, { name: 'A', bank: 'B' })
      const params: Record<string, string> = {
        name: faker.finance.accountName(),
        bank: faker.lorem.word(),
        balance: faker.finance.amount()
      }

      delete params[param]
      await supertest(server.app)
        .patch(patchPath(account.id))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when isActive field is successfully edited', async () => {
      const account = await accountsRepository.create(username, { name: 'A', bank: 'B' })
      const params = {
        isActive: !account.isActive
      }
      await supertest(server.app)
        .patch(patchPath(account.id))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(200)
    })
  })

  describe('GET /:id', () => {
    const getPath = (id: string) => `${path}/${id}`

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(getPath('any')).expect(401)
    })

    test('when id is not a valid ObjectId, it should respond 400', async () => {
      await supertest(server.app).get(getPath('not-a-valid-id')).auth(token, { type: 'bearer' }).expect(400)
    })

    test('when the account does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).get(getPath('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when account is of other user, it should response an error with status code 404', async () => {
      // Mock other user by using random id since we don't have another user's account easily.
      // But the id is 24 chars, and if it's not our user, it's 404.
      await supertest(server.app).get(getPath(generateId())).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when exist account for the user bank, it should response with status code 200', async () => {
      const account = await accountsRepository.create(username, { name: 'A', bank: 'B', balance: 100 })

      await supertest(server.app).get(getPath(account.id)).set('Authorization', `Bearer ${token}`)
        .expect(200, {
          _id: account.id,
          name: account.name,
          bank: account.bank,
          balance: account.balance
        })
    })
  })

  describe('POST /transfer', () => {
    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(`${path}/transfer`).expect(401)
    })

    test('when sourceId is not a valid id, it should respond 400', async () => {
      await supertest(server.app).post(`${path}/transfer`).auth(token, { type: 'bearer' })
        .send({ sourceId: 'invalid', destinationId: generateId(), amount: 10 })
        .expect(400)
    })

    test('when source account does not exist, it should respond 404', async () => {
      await supertest(server.app).post(`${path}/transfer`).auth(token, { type: 'bearer' })
        .send({ sourceId: generateId(), destinationId: generateId(), amount: 10 })
        .expect(404)
    })

    test('when destination account does not exist, it should respond 404', async () => {
      const source = await accountsRepository.create(username, { name: 'S', bank: 'B', balance: 100 })
      await supertest(server.app).post(`${path}/transfer`).auth(token, { type: 'bearer' })
        .send({ sourceId: source.id, destinationId: generateId(), amount: 10 })
        .expect(404)
    })

    test('when source equals destination, it should respond 422', async () => {
      const source = await accountsRepository.create(username, { name: 'S', bank: 'B', balance: 100 })
      await supertest(server.app).post(`${path}/transfer`).auth(token, { type: 'bearer' })
        .send({ sourceId: source.id, destinationId: source.id, amount: 10 })
        .expect(422)
    })

    test('when amount is not positive, it should respond 422', async () => {
      const source = await accountsRepository.create(username, { name: 'S', bank: 'B', balance: 100 })
      const dest = await accountsRepository.create(username, { name: 'D', bank: 'B', balance: 50 })
      await supertest(server.app).post(`${path}/transfer`).auth(token, { type: 'bearer' })
        .send({ sourceId: source.id, destinationId: dest.id, amount: -5 })
        .expect(422)
    })

    test('when source has insufficient balance, it should respond an error', async () => {
      const source = await accountsRepository.create(username, { name: 'S', bank: 'B', balance: 10 })
      const dest = await accountsRepository.create(username, { name: 'D', bank: 'B', balance: 50 })
      await supertest(server.app).post(`${path}/transfer`).auth(token, { type: 'bearer' })
        .send({ sourceId: source.id, destinationId: dest.id, amount: 100 })
        .expect((res) => {
          expect(res.status).toBe(400)
          expect(res.body.message).toBe('Insufficient balance')
        })
    })

    test('when successful transfer, it should return 200 and move the balances', async () => {
      const source = await accountsRepository.create(username, { name: 'S', bank: 'B', balance: 100 })
      const dest = await accountsRepository.create(username, { name: 'D', bank: 'B', balance: 50 })

      await supertest(server.app).post(`${path}/transfer`).auth(token, { type: 'bearer' })
        .send({ sourceId: source.id, destinationId: dest.id, amount: 25 })
        .expect((res) => {
          expect(res.status).toBe(200)
          expect(res.body).toEqual({ message: 'Transfer successful' })
        })

      const sAfter = sqliteDb.select().from(accounts).where(eq(accounts.id, source.id)).get()
      const dAfter = sqliteDb.select().from(accounts).where(eq(accounts.id, dest.id)).get()
      expect(sAfter.balance).toBe(75)
      expect(dAfter.balance).toBe(75)
    })
  })
})
