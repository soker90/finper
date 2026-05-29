import supertest from 'supertest'
import {
  BudgetModel, CategoryModel, ICategory,
  mongoose, TransactionModel, TRANSACTION
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertBudget, insertCategory, insertTransaction } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'
import { ERROR_MESSAGE } from '../../src/i18n'

import createTestDatabase from '../test-db'
const testDatabase = createTestDatabase(mongoose)

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
        expenses: [],
        rule503020: {
          needs: { budgeted: 0, real: 0, percentageBudgeted: 0, percentageReal: 0 },
          wants: { budgeted: 0, real: 0, percentageBudgeted: 0, percentageReal: 0 },
          savings: { budgeted: 0, real: 0, percentageBudgeted: 0, percentageReal: 0 },
          totals: { incomeBudgeted: 0, incomeReal: 0 }
        }
      })
    })

    const testBudgetsResponse = async ({
      budgetResponse,
      budgetValid,
      real,
      months = [0]
    }: { budgetResponse: any, budgetValid: any, real: number, months?: number[] }) => {
      const category = await CategoryModel.findOne({ _id: budgetValid.category }) as ICategory
      expect(budgetResponse.id).toBe(category._id.toString())
      expect(budgetResponse.name).toBe(category.name)
      months.forEach(month => {
        expect(budgetResponse.budgets[month].amount).toBe(budgetValid.amount)
        expect(budgetResponse.budgets[month].real).toBe(real)
      })

      expect(months.length).toBe(budgetResponse.budgets.length)
    }
    // TODO: flaky test — falla intermitentemente al ejecutar la suite completa
    // por interferencia entre tests Mongo (#651). Se mantiene skipped a propósito.
    // Reescribir con el patrón de aislamiento SQLite por worker cuando se migre
    // el módulo budget (Sesión M del plan de migración). Ver issue #769.
    test.skip('when there are budgets and month is provided, it should return the budgets', async () => {
      const year = faker.date.past().getFullYear()
      const month = faker.date.past().getMonth()
      const budgetIncome = await insertBudget({ user, type: TRANSACTION.Income, year, month })
      const budgetExpense = await insertBudget({ user, type: TRANSACTION.Expense, year, month })
      const transaction = await insertTransaction({
        user,
        category: budgetIncome.category._id,
        type: TRANSACTION.Income,
        date: new Date(year, month, faker.number.int({
          min: 1, max: 28
        })).getTime()
      })
      const transaction2 = await insertTransaction({
        user,
        category: budgetIncome.category._id,
        type: TRANSACTION.Income,
        date: new Date(year, month, faker.number.int({
          min: 1, max: 28
        })).getTime()
      })
      const response = await supertest(server.app).get(pathWithParams(year, month)).auth(token, { type: 'bearer' }).expect(200)

      await testBudgetsResponse({ budgetResponse: response.body.expenses[0], budgetValid: budgetExpense, real: 0 })
      await testBudgetsResponse({
        budgetResponse: response.body.incomes[0],
        budgetValid: budgetIncome,
        real: transaction.amount + transaction2.amount
      })
    })

    test('when there are budgets and month is not provided, it should return the budgets of all year', async () => {
      const year = faker.date.past().getFullYear()
      const month = faker.number.int({
        min: 0, max: 11
      })
      const budgetIncome = await insertBudget({ user, type: TRANSACTION.Income, year, month: month + 1 })
      const budgetExpense = await insertBudget({ user, type: TRANSACTION.Expense, year, month: month + 1 })
      const transaction = await insertTransaction({
        user,
        category: budgetIncome.category.toString(),
        type: TRANSACTION.Income,
        date: new Date(year, month, faker.number.int({
          min: 1, max: 28
        })).getTime()
      })
      const transaction2 = await insertTransaction({
        user,
        category: budgetIncome.category.toString(),
        type: TRANSACTION.Income,
        date: new Date(year, month, faker.number.int({
          min: 1, max: 28
        })).getTime()
      })

      const response = await supertest(server.app).get(pathWithParams(year)).auth(token, { type: 'bearer' }).expect(200)

      expect(response.body.incomes[0].budgets).toHaveLength(12)
      expect(response.body.incomes[0].budgets[month].amount).toBe(budgetIncome.amount)
      expect(response.body.incomes[0].budgets[month].real).toBe(transaction.amount + transaction2.amount)

      expect(response.body.expenses[0].budgets).toHaveLength(12)
      expect(response.body.expenses[0].budgets[month].amount).toBe(budgetExpense.amount)
      expect(response.body.expenses[0].budgets[month].real).toBe(0)
    })

    test('when budgets and transactions exist with budgetRuleClass, it should calculate the 50/30/20 rule properly', async () => {
      const year = 2026
      const month = 4 // May
      const date = new Date(year, month, 15).getTime()

      // Create categories with appropriate budgetRuleClass values
      const incomeCategory = await insertCategory({ user, type: TRANSACTION.Income })
      const needsCategory = await insertCategory({ user, type: TRANSACTION.Expense, budgetRuleClass: 'needs' })
      const wantsCategory = await insertCategory({ user, type: TRANSACTION.Expense, budgetRuleClass: 'wants' })
      const savingsCategory = await insertCategory({ user, type: TRANSACTION.Expense, budgetRuleClass: 'savings' })

      // Create budgets
      await BudgetModel.create([
        { user, year, month, category: incomeCategory._id, amount: 2000 },
        { user, year, month, category: needsCategory._id, amount: 900 },
        { user, year, month, category: wantsCategory._id, amount: 500 },
        { user, year, month, category: savingsCategory._id, amount: 200 }
      ])

      // Create transactions
      await insertTransaction({ user, category: incomeCategory._id.toString(), type: TRANSACTION.Income, amount: 2000, date })
      await insertTransaction({ user, category: needsCategory._id.toString(), type: TRANSACTION.Expense, amount: 1000, date })
      await insertTransaction({ user, category: wantsCategory._id.toString(), type: TRANSACTION.Expense, amount: 400, date })
      await insertTransaction({ user, category: savingsCategory._id.toString(), type: TRANSACTION.Expense, amount: 300, date })

      const response = await supertest(server.app)
        .get(pathWithParams(year, month))
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.rule503020).toEqual({
        needs: {
          budgeted: 900,
          real: 1000,
          percentageBudgeted: 45,
          percentageReal: 50
        },
        wants: {
          budgeted: 500,
          real: 400,
          percentageBudgeted: 25,
          percentageReal: 20
        },
        savings: {
          budgeted: 600,
          real: 600,
          percentageBudgeted: 30,
          percentageReal: 30
        },
        totals: {
          incomeBudgeted: 2000,
          incomeReal: 2000
        }
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
        .send({})
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

    test('when budget not exists, it should create it and response with status code 200', async () => {
      const params = {
        category: category._id.toString(),
        month: faker.number.int({ min: 0, max: 11 }),
        year: faker.number.int({ min: 2000, max: 2100 })
      }
      const body = { amount: faker.number.int() }
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
      const body = { amount: faker.number.int() }
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
        month: faker.number.int({ min: 0, max: 11 }),
        year: faker.number.int({ min: 2000, max: 2100 }),
        monthOrigin: faker.number.int({ min: 0, max: 11 }),
        yearOrigin: faker.number.int({ min: 2000, max: 2100 }),
        [param]: 'novalid'
      }
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(body)
        .expect(422)
    })

    test('when budget not exists, it should response with status code 204', async () => {
      const body = {
        month: faker.number.int({ min: 0, max: 11 }),
        year: faker.number.int({ min: 2000, max: 2100 }),
        monthOrigin: faker.number.int({ min: 0, max: 11 }),
        yearOrigin: faker.number.int({ min: 2000, max: 2100 })
      }
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(body)
        .expect(204)
    })

    test('when has budgets, it should response with status code 201', async () => {
      const monthOrigin = faker.number.int({ min: 0, max: 11 })
      const yearOrigin = faker.number.int({ min: 2000, max: 2100 })
      await insertBudget({ user, month: monthOrigin, year: yearOrigin })
      const body = {
        month: faker.number.int({ min: 0, max: 11 }),
        year: faker.number.int({ min: 2000, max: 2100 }),
        monthOrigin,
        yearOrigin
      }
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(body)
        .expect(201)
    })

    test('when has budgets, it should copy them', async () => {
      const monthOrigin = faker.number.int({ min: 0, max: 11 })
      const yearOrigin = faker.number.int({ min: 2000, max: 2100 })
      const numBudgets = faker.number.int({ min: 1, max: 4 })
      const oldBudgets = await Promise.all(Array.from({ length: numBudgets }, () => insertBudget({
        user,
        month: monthOrigin,
        year: yearOrigin
      })))

      const body = {
        month: faker.number.int({ min: 0, max: 11 }),
        year: faker.number.int({ min: 2000, max: 2100 }),
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

    test('when copying twice to the same month, it should not create duplicates', async () => {
      const monthOrigin = faker.number.int({ min: 0, max: 11 })
      const yearOrigin = faker.number.int({ min: 2000, max: 2100 })
      const numBudgets = 3
      const oldBudgets = await Promise.all(Array.from({ length: numBudgets }, () => insertBudget({
        user,
        month: monthOrigin,
        year: yearOrigin
      })))

      const body = {
        month: faker.number.int({ min: 0, max: 11 }),
        year: faker.number.int({ min: 2000, max: 2100 }),
        monthOrigin,
        yearOrigin
      }

      // First copy
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send(body).expect(201)

      // Second copy to the same month
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send(body).expect(201)

      // Verify no duplicates were created
      const finalBudgets = await BudgetModel.find({ year: body.year, month: body.month, user })
      expect(finalBudgets.length).toBe(oldBudgets.length)
    })
  })
})
