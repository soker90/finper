import supertest from 'supertest'
import {
  AccountModel,
  DebtModel,
  DebtType,
  mongoose,
  PensionModel,
  TransactionModel,
  TRANSACTION
} from '@soker90/finper-models'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertAccount, insertDebt, insertPension, insertTransaction } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Dashboard', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('GET /stats', () => {
    const path = '/api/dashboard/stats'
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(async () => {
      await TransactionModel.deleteMany({})
      await AccountModel.deleteMany({})
      await DebtModel.deleteMany({})
      await PensionModel.deleteMany({})
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no data, it should return default stats', async () => {
      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toHaveProperty('totalBalance', 0)
      expect(response.body).toHaveProperty('totalDebts', 0)
      expect(response.body).toHaveProperty('netWorth', 0)
      expect(response.body).toHaveProperty('monthlyIncome', 0)
      expect(response.body).toHaveProperty('monthlyExpenses', 0)
      expect(response.body).toHaveProperty('savingsRate', 0)
      expect(response.body).toHaveProperty('last6Months')
      expect(response.body).toHaveProperty('expenseVelocity')
      expect(response.body).toHaveProperty('topExpenseCategories')
      expect(response.body).toHaveProperty('topStores')
      expect(response.body).toHaveProperty('monthlyTrend')
      expect(response.body).toHaveProperty('dailyAvgExpense')
      expect(response.body).toHaveProperty('projectedMonthlyExpense')
      expect(response.body).toHaveProperty('cashRunwayMonths')
      // Nuevos campos
      expect(response.body).toHaveProperty('pension', null)
      expect(response.body).toHaveProperty('pensionReturnPct', 0)
      expect(response.body).toHaveProperty('budgetAdherencePct')
      expect(response.body).toHaveProperty('healthScore')
      expect(response.body.healthScore).toHaveProperty('total')
      expect(response.body.healthScore).toHaveProperty('savingsRate')
      expect(response.body.healthScore).toHaveProperty('debtRatio')
      expect(response.body.healthScore).toHaveProperty('budgetAdherence')
      expect(response.body.healthScore).toHaveProperty('cashRunway')
      expect(response.body.healthScore).toHaveProperty('pensionReturn')
    })

    test('should return correct monthly income and expenses for the current month', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 100, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(year, month, 10).getTime(), amount: 50, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(year, month, 3).getTime(), amount: 2000, type: TRANSACTION.Income })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.monthlyIncome).toBe(2000)
      expect(response.body.monthlyExpenses).toBe(150)
    })

    test('should return correct monthly trend comparing current vs previous month', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year

      // Current month
      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 100, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(year, month, 3).getTime(), amount: 2000, type: TRANSACTION.Income })

      // Previous month
      await insertTransaction({ user, date: new Date(prevYear, prevMonth, 15).getTime(), amount: 300, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(prevYear, prevMonth, 10).getTime(), amount: 1500, type: TRANSACTION.Income })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.monthlyTrend.income.current).toBe(2000)
      expect(response.body.monthlyTrend.income.previous).toBe(1500)
      expect(response.body.monthlyTrend.expenses.current).toBe(100)
      expect(response.body.monthlyTrend.expenses.previous).toBe(300)
    })

    test('should return last6Months with aggregated data', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 100, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(year, month, 3).getTime(), amount: 2000, type: TRANSACTION.Income })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(response.body.last6Months)).toBe(true)
      // Should have at least the current month entry
      const currentEntry = response.body.last6Months.find(
        (e: any) => e.month === month + 1 && e.year === year
      )
      expect(currentEntry).toBeDefined()
      expect(currentEntry.income).toBe(2000)
      expect(currentEntry.expenses).toBe(100)
    })

    test('should return top expense categories for the current month', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 300, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(year, month, 6).getTime(), amount: 100, type: TRANSACTION.Expense })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(response.body.topExpenseCategories)).toBe(true)
      expect(response.body.topExpenseCategories.length).toBeGreaterThanOrEqual(1)
      response.body.topExpenseCategories.forEach((cat: any) => {
        expect(cat).toHaveProperty('name')
        expect(cat).toHaveProperty('amount')
        expect(typeof cat.name).toBe('string')
        expect(typeof cat.amount).toBe('number')
      })
      // Should be sorted descending
      for (let i = 1; i < response.body.topExpenseCategories.length; i++) {
        expect(response.body.topExpenseCategories[i - 1].amount)
          .toBeGreaterThanOrEqual(response.body.topExpenseCategories[i].amount)
      }
    })

    test('should return expense velocity with cumulative daily amounts', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertTransaction({ user, date: new Date(year, month, 1).getTime(), amount: 50, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(year, month, 3).getTime(), amount: 30, type: TRANSACTION.Expense })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.expenseVelocity).toHaveProperty('currentMonth')
      expect(response.body.expenseVelocity).toHaveProperty('previousMonth')
      expect(Array.isArray(response.body.expenseVelocity.currentMonth)).toBe(true)

      // Day 1 should have 50, day 3 should have 80 (cumulative)
      const day1 = response.body.expenseVelocity.currentMonth.find((d: any) => d.day === 1)
      const day3 = response.body.expenseVelocity.currentMonth.find((d: any) => d.day === 3)
      expect(day1?.amount).toBe(50)
      expect(day3?.amount).toBe(80)
    })

    test('should compute totalBalance from active accounts only', async () => {
      await insertAccount({ user, balance: 1000, isActive: true })
      await insertAccount({ user, balance: 500, isActive: true })
      await insertAccount({ user, balance: 9999, isActive: false })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.totalBalance).toBe(1500)
    })

    test('should compute totalDebts from unpaid debts only', async () => {
      await insertDebt({ user, amount: 200, type: DebtType.TO, paymentDate: 0 })
      await insertDebt({ user, amount: 300, type: DebtType.TO, paymentDate: 0 })
      // Paid debt - should not count
      await insertDebt({ user, amount: 9999, type: DebtType.TO })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.totalDebts).toBe(500)
    })

    test('should compute netWorth as totalBalance minus totalDebts', async () => {
      await insertAccount({ user, balance: 1000, isActive: true })
      await insertDebt({ user, amount: 200, type: DebtType.TO, paymentDate: 0 })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.netWorth).toBe(800)
    })

    test('not_computable transactions should not be included in any totals', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 500, type: TRANSACTION.NotComputable })
      await insertTransaction({ user, date: new Date(year, month, 6).getTime(), amount: 100, type: TRANSACTION.Expense })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.monthlyExpenses).toBe(100)
      expect(response.body.monthlyIncome).toBe(0)
    })

    test('transactions of other users should not be included', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      // Another user's transaction
      await insertTransaction({ date: new Date(year, month, 5).getTime(), amount: 9999, type: TRANSACTION.Expense })
      // Our user's transaction
      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 100, type: TRANSACTION.Expense })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.monthlyExpenses).toBe(100)
    })

    test('expense refunds (negative amount) should reduce expense totals', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 50, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(year, month, 10).getTime(), amount: -40, type: TRANSACTION.Expense })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.monthlyExpenses).toBe(10)
    })

    test('should compute savingsRate correctly', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertTransaction({ user, date: new Date(year, month, 3).getTime(), amount: 1000, type: TRANSACTION.Income })
      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 200, type: TRANSACTION.Expense })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      // savingsRate = (1000 - 200) / 1000 * 100 = 80%
      expect(response.body.savingsRate).toBe(80)
    })

    test('should return pension data with pensionReturnPct when pension records exist', async () => {
      // employeeAmount=600, companyAmount=400 → contributed=1000
      // value=1.5, units = employeeUnits+companyUnits = 500+500 = 1000
      // total = 1.5 * 1000 = 1500 → return = (1500-1000)/1000 * 100 = 50%
      await insertPension({
        user,
        employeeAmount: 600,
        companyAmount: 400,
        employeeUnits: 500,
        companyUnits: 500,
        value: 1.5,
        date: Date.now()
      })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.pension).not.toBeNull()
      expect(response.body.pension).toHaveProperty('employeeAmount', 600)
      expect(response.body.pension).toHaveProperty('companyAmount', 400)
      expect(response.body.pension).toHaveProperty('total', 1500)
      expect(response.body.pension).toHaveProperty('transactions')
      expect(Array.isArray(response.body.pension.transactions)).toBe(true)
      expect(response.body.pensionReturnPct).toBe(50)
    })

    test('should include healthScore with all sub-scores in response', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertAccount({ user, balance: 10000, isActive: true })
      await insertTransaction({ user, date: new Date(year, month, 3).getTime(), amount: 3000, type: TRANSACTION.Income })
      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 1000, type: TRANSACTION.Expense })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      const hs = response.body.healthScore
      expect(typeof hs.total).toBe('number')
      expect(hs.total).toBeGreaterThanOrEqual(0)
      expect(hs.total).toBeLessThanOrEqual(100)
      expect(typeof hs.savingsRate).toBe('number')
      expect(typeof hs.debtRatio).toBe('number')
      expect(typeof hs.budgetAdherence).toBe('number')
      expect(typeof hs.cashRunway).toBe('number')
      expect(typeof hs.pensionReturn).toBe('number')
    })
  })
})
