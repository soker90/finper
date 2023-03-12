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
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, {
        amount: 0,
        units: 0,
        employeeAmount: 0,
        companyAmount: 0,
        transactions: []
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
      expect(response.body.total).toBe(response.body.amount * response.body.units)
    })
  })
})
