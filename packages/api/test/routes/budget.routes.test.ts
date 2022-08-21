import supertest from 'supertest'
import {
  BudgetModel, CategoryModel,
  mongoose, TransactionModel, TransactionType
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertBudget, insertTransaction } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Budget', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('GET /', () => {
    const path = '/api/budgets'
    const pathWithParams = (year: number, month?: number) => `${path}?${year ? `year=${year}` : ''}${month ? `&month=${month}` : ''}`

    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(async () => {
      await BudgetModel.deleteMany({})
      await TransactionModel.deleteMany({})
      await CategoryModel.deleteMany({})
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when year is not provider, it should response an error with status code 422', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(422)
    })

    test('when there are no budgets, it should return an empty array of incomes and other of expenses', async () => {
      await supertest(server.app).get(pathWithParams(2000, 1)).auth(token, { type: 'bearer' }).expect(200, {
        incomes: [],
        expenses: []
      })
    })

    const testBudgetsResponse = ({
      budgetResponse,
      budgetValid,
      real,
      months = [0]
    }: { budgetResponse: any, budgetValid: any, real: number, months?: number[] }) => {
      expect(budgetResponse.id).toBe(budgetValid.category._id.toString())
      expect(budgetResponse.name).toBe(budgetValid.category.name)
      months.forEach(month => {
        expect(budgetResponse.budgets[month].amount).toBe(budgetValid.amount)
        expect(budgetResponse.budgets[month].budgetId).toBe(budgetValid._id.toString())
        expect(budgetResponse.budgets[month].real).toBe(real)
      })
    }
    test('when there are budgets and month is provided, it should return the budgets', async () => {
      const year = faker.date.past().getFullYear()
      const month = faker.date.past().getMonth()
      const budgetIncome = await insertBudget({ user, type: TransactionType.Income, year, month })
      const budgetExpense = await insertBudget({ user, type: TransactionType.Expense, year, month })
      const transaction = await insertTransaction({
        user,
        category: budgetIncome.category._id,
        type: TransactionType.Income,
        date: new Date(year, month, faker.datatype.number({
          min: 1, max: 28
        })).getTime()
      })
      const transaction2 = await insertTransaction({
        user,
        category: budgetIncome.category._id,
        type: TransactionType.Income,
        date: new Date(year, month, faker.datatype.number({
          min: 1, max: 28
        })).getTime()
      })
      const response = await supertest(server.app).get(pathWithParams(year, month)).auth(token, { type: 'bearer' }).expect(200)

      testBudgetsResponse({ budgetResponse: response.body.expenses[0], budgetValid: budgetExpense, real: 0 })
      testBudgetsResponse({
        budgetResponse: response.body.incomes[0],
        budgetValid: budgetIncome,
        real: transaction.amount + transaction2.amount
      })
    })

    test('when there are budgets and month is not provided, it should return the budgets of all year', async () => {
      const year = faker.date.past().getFullYear()
      const month = faker.datatype.number({
        min: 0, max: 11
      })
      const budgetIncome = await insertBudget({ user, type: TransactionType.Income, year, month: month + 1 })
      const budgetExpense = await insertBudget({ user, type: TransactionType.Expense, year })
      const transaction = await insertTransaction({
        user,
        category: budgetIncome.category._id.toString(),
        type: TransactionType.Income,
        date: new Date(year, month, faker.datatype.number({
          min: 1, max: 28
        })).getTime()
      })
      const transaction2 = await insertTransaction({
        user,
        category: budgetIncome.category._id.toString(),
        type: TransactionType.Income,
        date: new Date(year, month, faker.datatype.number({
          min: 1, max: 28
        })).getTime()
      })
      const response = await supertest(server.app).get(pathWithParams(year)).auth(token, { type: 'bearer' }).expect(200)

      testBudgetsResponse({
        budgetResponse: response.body.expenses[0],
        budgetValid: budgetExpense,
        real: 0,
        months: [budgetExpense.month - 1]
      })
      testBudgetsResponse({
        budgetResponse: response.body.incomes[0],
        budgetValid: budgetIncome,
        real: transaction.amount + transaction2.amount,
        months: [month]
      })
    })
  })
})
