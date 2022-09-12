import supertest from 'supertest'
import {
  BudgetModel, CategoryModel, ICategory,
  mongoose, TransactionModel, TransactionType
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertBudget, insertCategory, insertTransaction } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'
import { ERROR_MESSAGE } from '../../src/i18n'

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

  describe('PATCH /:id', () => {
    const path = ({
      category,
      year,
      month
    }: { category: string, year: number, month: number }) => `/api/budgets/${category}/${year}/${month}`
    let token: string
    const user = generateUsername()
    let category: ICategory

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    beforeEach(async () => {
      category = await insertCategory({ user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).patch(path({ category: 'any', month: 9, year: 3 })).expect(401)
    })

    test('when the category does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).patch(path({
        category: '62a39498c4497e1fe3c2bf35',
        month: 1,
        year: 3
      })).auth(token, { type: 'bearer' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.CATEGORY.NOT_FOUND)
        })
    })

    test.each(['month', 'year'])('when %s is not valid, it should response an error with status code 422', async (param: string) => {
      await supertest(server.app).patch(path({
        category: category._id.toString(),
        month: 1,
        year: 3,
        [param]: 'novalid'
      })).auth(token, { type: 'bearer' })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.BUDGET.YEAR_MONTH_INVALID)
        })
    })

    test('when amount is not provided, it should response an error with status code 422', async () => {
      await supertest(server.app).patch(path({
        category: category._id.toString(),
        month: 1,
        year: 3
      })).auth(token, { type: 'bearer' })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.BUDGET.INVALID_AMOUNT)
        })
    })

    test('when amount is not valid, it should response an error with status code 422', async () => {
      await supertest(server.app).patch(path({
        category: category._id.toString(),
        month: 1,
        year: 3
      })).auth(token, { type: 'bearer' })
        .send({ amount: 'novalid' })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.BUDGET.INVALID_AMOUNT)
        })
    })

    test('when budget not exists, it should response with status code 200', async () => {
      const params = {
        category: category._id.toString(),
        month: faker.datatype.number({ min: 0, max: 11 }),
        year: faker.datatype.number({ min: 2000, max: 2100 })
      }
      const body = { amount: faker.datatype.number() }
      await supertest(server.app).patch(path(params)).auth(token, { type: 'bearer' })
        .send(body)
        .expect(200)
        .expect((res) => {
          expect(res.body.amount).toBe(body.amount)
          expect(res.body.category).toBe(params.category)
          expect(res.body.month).toBe(params.month)
          expect(res.body.year).toBe(params.year)
          expect(res.body.user).toBe(user)
        })
    })

    test('when budget exists, it should response with status code 200 and it changes', async () => {
      const budget = await insertBudget({ user })
      const body = { amount: faker.datatype.number() }
      await supertest(server.app).patch(path({
        category: budget.category._id.toString(),
        year: budget.year,
        month: budget.month
      })).auth(token, { type: 'bearer' })
        .send(body)
        .expect(200)
        .expect((res) => {
          expect(res.body.amount).not.toBe(budget.amount)
          expect(res.body.amount).toBe(body.amount)
        })
    })
  })

  describe('POST /', () => {
    const path = '/api/budgets'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(() => BudgetModel.deleteMany({}))

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test.each(['month', 'year', 'monthOrigin', 'yearOrigin'])('when %s is not valid, it should response an error with status code 422', async (param: string) => {
      const body = {
        month: faker.datatype.number({ min: 0, max: 11 }),
        year: faker.datatype.number({ min: 2000, max: 2100 }),
        monthOrigin: faker.datatype.number({ min: 0, max: 11 }),
        yearOrigin: faker.datatype.number({ min: 2000, max: 2100 }),
        [param]: 'novalid'
      }
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(body)
        .expect(422)
    })

    test('when budget not exists, it should response with status code 204', async () => {
      const body = {
        month: faker.datatype.number({ min: 0, max: 11 }),
        year: faker.datatype.number({ min: 2000, max: 2100 }),
        monthOrigin: faker.datatype.number({ min: 0, max: 11 }),
        yearOrigin: faker.datatype.number({ min: 2000, max: 2100 })
      }
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(body)
        .expect(204)
    })

    test('when has budgets, it should response with status code 201', async () => {
      const monthOrigin = faker.datatype.number({ min: 0, max: 11 })
      const yearOrigin = faker.datatype.number({ min: 2000, max: 2100 })
      await insertBudget({ user, month: monthOrigin, year: yearOrigin })
      const body = {
        month: faker.datatype.number({ min: 0, max: 11 }),
        year: faker.datatype.number({ min: 2000, max: 2100 }),
        monthOrigin,
        yearOrigin
      }
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(body)
        .expect(201)
    })

    test('when has budgets, it should copy them', async () => {
      const monthOrigin = faker.datatype.number({ min: 0, max: 11 })
      const yearOrigin = faker.datatype.number({ min: 2000, max: 2100 })
      const numBudgets = faker.datatype.number({ min: 1, max: 4 })
      const oldBudgets = await Promise.all(Array.from({ length: numBudgets }, () => insertBudget({
        user,
        month: monthOrigin,
        year: yearOrigin
      })))

      const body = {
        month: faker.datatype.number({ min: 0, max: 11 }),
        year: faker.datatype.number({ min: 2000, max: 2100 }),
        monthOrigin,
        yearOrigin
      }
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send(body)

      const newBudgets = await BudgetModel.find({ year: body.year, month: body.month, user })
      expect(oldBudgets.length).toBe(newBudgets.length)
      for (const budget of oldBudgets) {
        const newBudget = newBudgets.find(newBudget => newBudget.category.toString() === budget.category._id.toString())
        expect(newBudget?.amount).toBe(budget.amount)
      }
    })
  })
})
