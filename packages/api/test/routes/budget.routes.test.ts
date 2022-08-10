import supertest from 'supertest'
import {
  BudgetModel,
  mongoose
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertBudget } from '../insert-data-to-model'
import { ERROR_MESSAGE } from '../../src/i18n'
import { generateUsername } from '../generate-values'
import { expectCt } from 'helmet'
import { deepEqual } from 'assert'

const testDatabase = require('../test-db')(mongoose)

describe('Budget', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('GET /', () => {
    const path = '/api/budgets'
    const pathWithParams = (year: number, month: number) => `${path}?${year ? `year=${year}` : ''}${month ? `&month=${month}` : ''}`

    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when year is not provider, it should response an error with status code 422', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(422)
    })

    test('when there are no budgets, it should return an empty array', async () => {
      await supertest(server.app).get(pathWithParams(2000, 1)).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are budgets, it should return the budgets', async () => {
      const budget = await insertBudget({ user })
      const reponse = await supertest(server.app).get(pathWithParams(budget.year, budget.month)).auth(token, { type: 'bearer' }).expect(200)

      const budgetResponse = reponse.body[0]
      expect(budgetResponse._id).toBe(budget._id.toString())
      budget.budget.forEach((categoryBudget: any, index: number) => {
        expect(categoryBudget._id.toString()).toBe(budgetResponse.budget[index]._id)
        expect(categoryBudget.amount).toBe(budgetResponse.budget[index].amount)
        expect(categoryBudget.category._id.toString()).toBe(budgetResponse.budget[index].category)
      })
    })

    // TODO: check without month
  })
})
