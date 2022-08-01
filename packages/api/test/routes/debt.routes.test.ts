import supertest from 'supertest'
import {
  DebtType,
  IDebt,
  mongoose
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertDebt } from '../insert-data-to-model'
import { ERROR_MESSAGE } from '../../src/i18n'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Debt', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /', () => {
    const path = '/api/debts'
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).expect(422)
    })

    test.each(['from', 'amount', 'type'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, string | number> = {
        from: faker.name.firstName(),
        amount: faker.datatype.number(),
        type: Math.random() > 0.5 ? DebtType.TO : DebtType.FROM
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
          from: faker.name.firstName(),
          amount: faker.datatype.number(),
          type: Math.random() > 0.5 ? DebtType.TO : DebtType.FROM
        })
        .expect(200)
    })
  })

  describe('GET /', () => {
    const path = '/api/debts'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no debts, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are debts, it should return the debts', async () => {
      const name = `a${faker.name.firstName()}`
      const name2 = `b${faker.name.firstName()}`
      const from = await insertDebt({ user, type: DebtType.FROM, from: name, paymentDate: 0 })
      const to = await insertDebt({ user, type: DebtType.TO, from: name2, paymentDate: 0 })
      const to2 = await insertDebt({ user, type: DebtType.TO, from: name, paymentDate: 0 })
      const getResponseDebt = (debt: any) => ({
        _id: debt._id.toString(),
        from: debt.from,
        date: debt.date,
        amount: debt.amount,
        ...(debt.paymentDate && { paymentDate: debt.paymentDate }),
        concept: debt.concept,
        type: debt.type,
        user: debt.user
      })
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, {
        from: [getResponseDebt(from)],
        to: [getResponseDebt(to), getResponseDebt(to2)],
        debtsByPerson: [
          { _id: name, total: from.amount - to2.amount },
          { _id: name2, total: -to.amount }
        ]
      })
    })
  })

  describe('GET /from', () => {
    const path = (from: string) => `/api/debts/from/${from}`
    let token: string
    const user = generateUsername()
    const from = faker.name.firstName()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path(from)).expect(401)
    })

    test('when there are no debts, it should return an empty array', async () => {
      await insertDebt({ user })
      await supertest(server.app).get(path(from)).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are debts, it should return the debts', async () => {
      const debt = await insertDebt({ user, from })
      await supertest(server.app).get(path(from)).auth(token, { type: 'bearer' }).expect(200, [{
        _id: debt._id.toString(),
        from: debt.from,
        date: debt.date,
        amount: debt.amount,
        paymentDate: debt.paymentDate,
        concept: debt.concept,
        type: debt.type,
        user: debt.user
      }])
    })
  })

  describe('PUT /:id', () => {
    const path = (id: string) => `/api/debts/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).put(path('any')).expect(401)
    })

    test('when the debt does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.DEBT.NOT_FOUND)
        })
    })

    test('when user is distinct, it should response an error with status code 404', async () => {
      const debt: IDebt = await insertDebt()
      await supertest(server.app).put(path(debt._id.toString())).auth(token, { type: 'bearer' }).expect(404)
    })

    test.each(['from', 'amount', 'type'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const debt: IDebt = await insertDebt({ user })
      const params: Record<string, string | number> = {
        from: faker.name.firstName(),
        amount: faker.datatype.number(),
        type: Math.random() > 0.5 ? DebtType.TO : DebtType.FROM
      }

      delete params[param]
      await supertest(server.app)
        .put(path(debt._id.toString()))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when fields are successfully edited', async () => {
      const debt: IDebt = await insertDebt({ user })
      const params: Record<string, string | number> = {
        from: faker.name.firstName(),
        amount: faker.datatype.number(),
        type: Math.random() > 0.5 ? DebtType.TO : DebtType.FROM
      }
      await supertest(server.app)
        .put(path(debt._id.toString()))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(200)
    })
  })

  describe('DELETE /:id', () => {
    const path = (id: string) => `/api/debts/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).delete(path('any')).expect(401)
    })

    test('when the debts does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).delete(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when exist the debt, it should response with status code 204', async () => {
      const debt: IDebt = await insertDebt({ user })

      await supertest(server.app).delete(path(debt._id.toString())).set('Authorization', `Bearer ${token}`).expect(204)
    })

    test('when exist the category, but belongs to another user it should response with status code 404', async () => {
      const debt: IDebt = await insertDebt()

      await supertest(server.app).delete(path(debt._id.toString())).set('Authorization', `Bearer ${token}`).expect(404)
    })
  })
})
