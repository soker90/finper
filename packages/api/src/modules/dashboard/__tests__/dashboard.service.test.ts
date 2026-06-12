import { DashboardService } from '../dashboard.service'
import { createDashboardRepository } from '../dashboard.repository'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { users, accounts, loans, categories, transactions } = schema

describe('Dashboard Service (Part B - getStats)', () => {
  const service = new DashboardService(createDashboardRepository(sqliteDb))
  const user = generateUsername()
  let accountId: string
  let categoryId: string

  beforeAll(() => {
    sqliteDb.insert(users).values({ id: generateId(), username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
    accountId = generateId()
    sqliteDb.insert(accounts).values({ id: accountId, name: 'Active', bank: 'B', balance: 1000, isActive: true, user }).run()
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Comida', type: 'expense', budgetRuleClass: 'none', user }).run()
    sqliteDb.insert(loans).values({ id: generateId(), name: 'Loan', initialAmount: 8000, pendingAmount: 5000, interestRate: 3, startDate: Date.now(), monthlyPayment: 200, initialEstimatedCost: 9000, accountId, categoryId, user }).run()

    const now = Date.now()
    sqliteDb.insert(transactions).values({ id: generateId(), date: now, categoryId, amount: 2000, type: 'income', accountId, note: null, storeId: null, subscriptionId: null, tags: [], user }).run()
    sqliteDb.insert(transactions).values({ id: generateId(), date: now, categoryId, amount: 300, type: 'expense', accountId, note: null, storeId: null, subscriptionId: null, tags: [], user }).run()
  })

  afterAll(() => {
    sqliteDb.delete(transactions).where(eq(transactions.user, user)).run()
    sqliteDb.delete(loans).where(eq(loans.user, user)).run()
    sqliteDb.delete(categories).where(eq(categories.user, user)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, user)).run()
    sqliteDb.delete(users).where(eq(users.username, user)).run()
  })

  it('aggregates balances, loans and current-month income/expenses', async () => {
    const result = await service.getStats({ user })
    expect(result.totalBalance).toBe(1000)
    expect(result.totalLoansPending).toBe(5000)
    expect(result.totalDebts).toBe(0)
    expect(result.netWorth).toBe(-4000)
    expect(result.monthlyIncome).toBe(2000)
    expect(result.monthlyExpenses).toBe(300)
  })

  it('returns the full result shape (velocity, health score, insights, rankings)', async () => {
    const result = await service.getStats({ user })
    expect(result).toHaveProperty('expenseVelocity.currentMonth')
    expect(Array.isArray(result.last6Months)).toBe(true)
    expect(result.healthScore).toHaveProperty('total')
    expect(Array.isArray(result.insights)).toBe(true)
    expect(Array.isArray(result.topExpenseCategories)).toBe(true)
    expect(result.pension).toBeNull()
  })
})
