import supertest from 'supertest'
import { faker } from '@faker-js/faker'
import {
  PensionModel,
  IPension,
  mongoose
} from '@soker90/finper-models'

import { server } from '../../src/server'
import { ERROR_MESSAGE } from '../../src/i18n'

import { requestLogin } from '../request-login'
import { insertPension } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Pension', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /', () => {
    const path = '/api/pensions'
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

    test.each(['date', 'employeeAmount', 'employeeUnits', 'companyAmount', 'companyUnits', 'value'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, number> = {
        date: faker.date.recent().getTime(),
        employeeAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
        employeeUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
        companyAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
        companyUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
        value: faker.number.float({ precision: 2 })
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
          date: faker.date.recent().getTime(),
          employeeAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
          employeeUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
          companyAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
          companyUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
          value: faker.number.float({ precision: 2 })
        })
        .expect(200)
    })
  })

  describe('GET /', () => {
    const path = '/api/pensions'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(() => PensionModel.deleteMany({}))

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no pensions, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, {
        amount: 0,
        units: 0,
        employeeAmount: 0,
        companyAmount: 0,
        transactions: [],
        total: 0
      })
    })

    test('when there are pensions, it should return the pensions', async () => {
      const pension = await insertPension({ user })
      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      const responsePension: IPension = response.body.transactions[0]
      expect(responsePension._id).toBe(pension._id.toString())
      expect(responsePension.date).toBe(pension.date)
      expect(responsePension.employeeUnits).toBe(pension.employeeUnits)
      expect(responsePension.employeeAmount).toBe(pension.employeeAmount)
      expect(responsePension.companyAmount).toBe(pension.companyAmount)
      expect(responsePension.companyUnits).toBe(pension.companyUnits)
      expect(responsePension.value).toBe(pension.value)
      expect(response.body.amount).toBe(pension.employeeAmount + pension.companyAmount)
      expect(response.body.units).toBe(pension.employeeUnits + pension.companyUnits)
      expect(response.body.employeeAmount).toBe(pension.employeeAmount)
      expect(response.body.companyAmount).toBe(pension.companyAmount)
      expect(response.body.total).toBe(pension.value * response.body.units)
    })
  })

  describe('PUT /:id', () => {
    const path = (id: string) => `/api/pensions/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when the pension does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.PENSION.NOT_FOUND)
        })
    })

    test('when user is distinct, it should response an error with status code 404', async () => {
      const pension: IPension = await insertPension()
      await supertest(server.app).patch(path(pension._id.toString())).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      const pension: IPension = await insertPension({ user })
      await supertest(server.app).put(path(pension._id.toString())).auth(token, { type: 'bearer' }).expect(422)
    })

    test.each(['date', 'employeeAmount', 'employeeUnits', 'companyAmount', 'companyUnits', 'value'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const pension: IPension = await insertPension({ user })
      const params: Record<string, number> = {
        date: faker.date.recent().getTime(),
        employeeAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
        employeeUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
        companyAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
        companyUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
        value: faker.number.float({ precision: 2 })
      }

      delete params[param]
      await supertest(server.app)
        .put(path(pension._id.toString()))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when fields are successfully edited', async () => {
      const pension: IPension = await insertPension({ user })

      const params = {
        date: faker.date.recent().getTime(),
        employeeAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
        employeeUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
        companyAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
        companyUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
        value: faker.number.float({ precision: 2 })
      }
      await supertest(server.app)
        .put(path(pension._id.toString()))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(200, {
          _id: pension._id.toString(),
          ...params,
          user
        })
    })
  })
})
