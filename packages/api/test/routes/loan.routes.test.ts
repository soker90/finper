import supertest from 'supertest'
import {
  DebtType,
  ILoan,
  mongoose
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertDebt } from '../insert-data-to-model'
import { ERROR_MESSAGE } from '../../src/i18n'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Loans', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('GET /', () => {
    const path = '/api/loans'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no loans, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are loans, it should return the loans', async () => {
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
})
