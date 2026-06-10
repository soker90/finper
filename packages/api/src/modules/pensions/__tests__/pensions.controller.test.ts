import supertest from 'supertest'
import { faker } from '@faker-js/faker'

import { server } from '../../../server'
import { ERROR_MESSAGE } from '../../../i18n'

import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'

import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const insertPension = (data: any = {}) => {
  const id = generateId()
  const dateNum = data.date ? data.date : Date.now()
  const record = {
    id,
    employeeAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
    employeeUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
    companyAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
    companyUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
    value: faker.number.float({ multipleOf: 2 }),
    user: generateUsername(),
    ...data,
    date: dateNum
  }
  sqliteDb.insert(schema.pensions).values(record).run()
  return { ...record, date: record.date, _id: id }
}

describe('Pension Controller', () => {
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
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['date', 'employeeAmount', 'employeeUnits', 'companyAmount', 'companyUnits', 'value'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, number> = {
        date: faker.date.recent().getTime(),
        employeeAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
        employeeUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
        companyAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
        companyUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
        value: faker.number.float({ multipleOf: 2 })
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
          employeeAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
          employeeUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
          companyAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
          companyUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
          value: faker.number.float({ multipleOf: 2 })
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

    afterEach(() => {
      sqliteDb.delete(schema.pensions).where(eq(schema.pensions.user, user)).run()
    })

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
      const pension = insertPension({ user })
      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)

      const responsePension = response.body.transactions[0]
      expect(responsePension._id).toBe(pension._id)
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

    afterEach(() => {
      sqliteDb.delete(schema.pensions).where(eq(schema.pensions.user, user)).run()
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when id is not a valid ObjectId, it should respond 400', async () => {
      await supertest(server.app).put(path('not-a-valid-id')).auth(token, { type: 'bearer' }).expect(400)
    })

    test('when the pension does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.PENSION.NOT_FOUND)
        })
    })

    test('when user is distinct, it should response an error with status code 404', async () => {
      const otherUser = generateUsername()
      sqliteDb.insert(schema.users).values({ id: generateId(), username: otherUser, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
      const pension = insertPension({ user: otherUser })
      await supertest(server.app).put(path(pension._id)).auth(token, { type: 'bearer' }).expect(404)
      sqliteDb.delete(schema.pensions).where(eq(schema.pensions.user, otherUser)).run()
      sqliteDb.delete(schema.users).where(eq(schema.users.username, otherUser)).run()
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      const pension = insertPension({ user })
      await supertest(server.app).put(path(pension._id)).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['date', 'employeeAmount', 'employeeUnits', 'companyAmount', 'companyUnits', 'value'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const pension = insertPension({ user })
      const params: Record<string, number> = {
        date: faker.date.recent().getTime(),
        employeeAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
        employeeUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
        companyAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
        companyUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
        value: faker.number.float({ multipleOf: 2 })
      }

      delete params[param]
      await supertest(server.app)
        .put(path(pension._id))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when fields are successfully edited', async () => {
      const pension = insertPension({ user })

      const params = {
        date: faker.date.recent().getTime(),
        employeeAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
        employeeUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
        companyAmount: faker.number.float({ min: 1, max: 100, multipleOf: 2 }),
        companyUnits: faker.number.float({ min: 1, max: 100, multipleOf: 5 }),
        value: faker.number.float({ multipleOf: 2 })
      }
      await supertest(server.app)
        .put(path(pension._id))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(200, {
          _id: pension._id,
          ...params,
          user
        })
    })
  })
})
