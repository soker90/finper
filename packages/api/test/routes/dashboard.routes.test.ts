import supertest from 'supertest'
import {
  AccountModel,
  CategoryModel,
  DebtModel,
  DEBT,
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
      await CategoryModel.deleteMany({})
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

    test('should compute totalDebts from all pending debts', async () => {
      await insertDebt({ user, amount: 200, type: DEBT.TO })
      await insertDebt({ user, amount: 300, type: DEBT.TO })
      await insertDebt({ user, amount: 9999, type: DEBT.TO })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.totalDebts).toBe(10499)
    })

    test('should compute netWorth as totalBalance minus totalDebts', async () => {
      await insertAccount({ user, balance: 1000, isActive: true })
      await insertDebt({ user, amount: 200, type: DEBT.TO })

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

    // Insights

    test('should include insights as an array in the response', async () => {
      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(response.body.insights)).toBe(true)
    })

    test('insights should have the correct shape when present', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      // Set up 3 months of high savings rate to trigger the streak insight
      const prevMonth2 = month - 2 < 0 ? month - 2 + 12 : month - 2
      const prevMonth1 = month - 1 < 0 ? month - 1 + 12 : month - 1
      const prevYear2 = month - 2 < 0 ? year - 1 : year
      const prevYear1 = month - 1 < 0 ? year - 1 : year

      await insertTransaction({ user, date: new Date(prevYear2, prevMonth2, 5).getTime(), amount: 1000, type: TRANSACTION.Income })
      await insertTransaction({ user, date: new Date(prevYear2, prevMonth2, 6).getTime(), amount: 100, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(prevYear1, prevMonth1, 5).getTime(), amount: 1000, type: TRANSACTION.Income })
      await insertTransaction({ user, date: new Date(prevYear1, prevMonth1, 6).getTime(), amount: 100, type: TRANSACTION.Expense })
      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 1000, type: TRANSACTION.Income })
      await insertTransaction({ user, date: new Date(year, month, 6).getTime(), amount: 100, type: TRANSACTION.Expense })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      const insights = response.body.insights
      expect(Array.isArray(insights)).toBe(true)
      expect(insights.length).toBeGreaterThan(0)

      insights.forEach((insight: any) => {
        expect(['warning', 'info', 'success', 'critical']).toContain(insight.type)
        expect(typeof insight.title).toBe('string')
        expect(insight.title.length).toBeGreaterThan(0)
        expect(typeof insight.message).toBe('string')
        expect(insight.message.length).toBeGreaterThan(0)
      })
    })

    // Cash runway with outlier filtering

    test('cash runway should exclude outlier transactions (> 3x mean per transaction)', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      const account = await insertAccount({ user, balance: 6000, isActive: true })

      // 2 months ago: 4 transactions of 100€ + 1 outlier of 900€ (> 3x mean=220 → outlier)
      // Without outlier: filtered total = 400€
      const twoMonthsAgo = month - 2 < 0 ? month - 2 + 12 : month - 2
      const twoMonthsAgoYear = month - 2 < 0 ? year - 1 : year
      for (let i = 1; i <= 4; i++) {
        await insertTransaction({ user, account: account._id, date: new Date(twoMonthsAgoYear, twoMonthsAgo, i).getTime(), amount: 100, type: TRANSACTION.Expense })
      }
      await insertTransaction({ user, account: account._id, date: new Date(twoMonthsAgoYear, twoMonthsAgo, 5).getTime(), amount: 900, type: TRANSACTION.Expense })

      // 1 month ago: 4 transactions of 100€ (no outlier) → filtered total = 400€
      const oneMonthAgo = month - 1 < 0 ? month - 1 + 12 : month - 1
      const oneMonthAgoYear = month - 1 < 0 ? year - 1 : year
      for (let i = 1; i <= 4; i++) {
        await insertTransaction({ user, account: account._id, date: new Date(oneMonthAgoYear, oneMonthAgo, i).getTime(), amount: 100, type: TRANSACTION.Expense })
      }

      // Current month: 4 transactions of 100€ (no outlier) → filtered total = 400€
      for (let i = 1; i <= 4; i++) {
        await insertTransaction({ user, account: account._id, date: new Date(year, month, i).getTime(), amount: 100, type: TRANSACTION.Expense })
      }

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      // avgFiltered ≈ 400, cashRunway = 6000/400 = 15 months
      // Without filter: (500+400+400)/3 = 433, cashRunway = 6000/433 ≈ 13.9
      expect(response.body.cashRunwayMonths).toBeGreaterThan(14)
    })

    test('cash runway should exclude outlier transactions (> 30% of monthly total)', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      const account = await insertAccount({ user, balance: 3000, isActive: true })

      // 1 transaction of 400€ in a month with total 1000€ → 40% of total → outlier
      // Remainder: 600€ → filtered = 600€
      const twoMonthsAgo = month - 2 < 0 ? month - 2 + 12 : month - 2
      const twoMonthsAgoYear = month - 2 < 0 ? year - 1 : year
      await insertTransaction({ user, account: account._id, date: new Date(twoMonthsAgoYear, twoMonthsAgo, 1).getTime(), amount: 400, type: TRANSACTION.Expense })
      for (let i = 2; i <= 7; i++) {
        await insertTransaction({ user, account: account._id, date: new Date(twoMonthsAgoYear, twoMonthsAgo, i).getTime(), amount: 100, type: TRANSACTION.Expense })
      }

      // 1 month ago: 6 x 100€ = 600€ (no outlier)
      const oneMonthAgo = month - 1 < 0 ? month - 1 + 12 : month - 1
      const oneMonthAgoYear = month - 1 < 0 ? year - 1 : year
      for (let i = 1; i <= 6; i++) {
        await insertTransaction({ user, account: account._id, date: new Date(oneMonthAgoYear, oneMonthAgo, i).getTime(), amount: 100, type: TRANSACTION.Expense })
      }

      // Current month: 6 x 100€ = 600€ (no outlier)
      for (let i = 1; i <= 6; i++) {
        await insertTransaction({ user, account: account._id, date: new Date(year, month, i).getTime(), amount: 100, type: TRANSACTION.Expense })
      }

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      // avgFiltered = (600+600+600)/3 = 600, cashRunway = 3000/600 = 5
      // Without filter: (1000+600+600)/3 ≈ 733, cashRunway ≈ 4.1
      expect(response.body.cashRunwayMonths).toBeGreaterThanOrEqual(5)
    })

    test('cash runway without outliers matches expected calculation', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      const account = await insertAccount({ user, balance: 1500, isActive: true })

      // 3 uniform months of 500€ (no outlier) → avgFiltered=500 → cashRunway=3
      for (let m = 0; m < 3; m++) {
        const targetMonth = month - m < 0 ? month - m + 12 : month - m
        const targetYear = month - m < 0 ? year - 1 : year
        // 5 transactions of 100€: mean=100, total=500 → none is >3x100 nor >30% of 500
        for (let d = 1; d <= 5; d++) {
          await insertTransaction({ user, account: account._id, date: new Date(targetYear, targetMonth, d).getTime(), amount: 100, type: TRANSACTION.Expense })
        }
      }

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.cashRunwayMonths).toBe(3)
    })
  })
})
