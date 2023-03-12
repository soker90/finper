import supertest from 'supertest'
import {
  PensionModel,
  IPension,
  mongoose
} from '@soker90/finper-models'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertPension } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Pension', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

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
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are pensions, it should return the pensions', async () => {
      const pension = await insertPension({ user })
      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
      const responsePension: IPension = response.body.find((iPension: IPension) => iPension._id.toString() === pension._id.toString())
      expect(responsePension._id).toBe(pension._id.toString())
      expect(responsePension.date).toBe(pension.date)
      expect(responsePension.employeeUnits).toBe(pension.employeeUnits)
      expect(responsePension.employeeAmount).toBe(pension.employeeAmount)
      expect(responsePension.companyAmount).toBe(pension.companyAmount)
      expect(responsePension.companyUnits).toBe(pension.companyUnits)
      expect(responsePension.value).toBe(pension.value)
    })
  })
})
