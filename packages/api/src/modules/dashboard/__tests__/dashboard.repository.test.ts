import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createDashboardRepository } from '../dashboard.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'

const { users, accounts, loans, categories, stores, transactions, budgets } = schema

describe('Dashboard Repository (Part A - aggregations)', () => {
  let db: DB
  let repo: ReturnType<typeof createDashboardRepository>
  let user: string
  let accountId: string
  let childFood: string
  let catIncome: string
  let storeId: string

  const marchStart = new Date(2025, 2, 1).getTime()
  const marchEnd = new Date(2025, 3, 1).getTime()
  const febMarStart = new Date(2025, 1, 1).getTime()
  const march = Date.UTC(2025, 2, 15, 12, 0, 0)
  const feb = Date.UTC(2025, 1, 15, 12, 0, 0)

  beforeAll(() => {
    db = createTestDb()
    repo = createDashboardRepository(db)
    user = generateUsername()
    db.insert(users).values({ id: 'dash-a-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()

    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Active', bank: 'B', balance: 1000, isActive: true, user }).run()
    db.insert(accounts).values({ id: generateId(), name: 'Inactive', bank: 'B', balance: 500, isActive: false, user }).run()

    const parent = generateId()
    db.insert(categories).values({ id: parent, name: 'Casa', type: 'expense', budgetRuleClass: 'none', user }).run()
    childFood = generateId()
    db.insert(categories).values({ id: childFood, name: 'Comida', type: 'expense', parentId: parent, budgetRuleClass: 'none', user }).run()
    catIncome = generateId()
    db.insert(categories).values({ id: catIncome, name: 'Nómina', type: 'income', budgetRuleClass: 'none', user }).run()

    db.insert(loans).values({ id: generateId(), name: 'Active loan', initialAmount: 10000, pendingAmount: 8000, interestRate: 3, startDate: march, monthlyPayment: 200, initialEstimatedCost: 11000, accountId, categoryId: parent, user }).run()
    db.insert(loans).values({ id: generateId(), name: 'Paid loan', initialAmount: 5000, pendingAmount: 0, interestRate: 3, startDate: march, monthlyPayment: 200, initialEstimatedCost: 5500, accountId, categoryId: parent, user }).run()

    storeId = generateId()
    db.insert(stores).values({ id: storeId, name: 'Mercadona', user }).run()

    const tx = (date: number, categoryId: string, amount: number, type: string, sId: string | null = null) =>
      db.insert(transactions).values({ id: generateId(), date, categoryId, amount, type, accountId, note: null, storeId: sId, subscriptionId: null, tags: [], user }).run()

    tx(march, childFood, 100, 'expense', storeId)
    tx(march, childFood, 50, 'expense')
    tx(march, catIncome, 2000, 'income')
    tx(feb, childFood, 80, 'expense')

    db.insert(budgets).values({ id: generateId(), year: 2025, month: 3, amount: 200, categoryId: childFood, user }).run()
  })

  afterAll(() => closeTestDb(db))

  it('sumActiveAccountsBalance: only active accounts', () => {
    expect(repo.sumActiveAccountsBalance(user)).toBe(1000)
  })

  it('sumPendingLoans: only loans with pendingAmount > 0', () => {
    expect(repo.sumPendingLoans(user)).toBe(8000)
  })

  it('monthIncomeExpenses: income and expenses within the range', () => {
    expect(repo.monthIncomeExpenses(user, marchStart, marchEnd)).toEqual({ income: 2000, expenses: 150 })
  })

  it('realExpenses: total expenses within the range', () => {
    expect(repo.realExpenses(user, marchStart, marchEnd)).toBe(150)
  })

  it('topExpenseCategories: name + parentName, sorted desc', () => {
    expect(repo.topExpenseCategories(user, marchStart, marchEnd)).toEqual([{ name: 'Comida', parentName: 'Casa', amount: 150 }])
  })

  it('topExpenseStores: only transactions with a store', () => {
    expect(repo.topExpenseStores(user, marchStart, marchEnd)).toEqual([{ name: 'Mercadona', amount: 100 }])
  })

  it('currentMonthByCategory: name, total and count', () => {
    expect(repo.currentMonthByCategory(user, marchStart, marchEnd))
      .toEqual([{ categoryId: childFood, name: 'Comida', total: 150, count: 2 }])
  })

  it('last6MonthsSummary: grouped by month (Madrid), sorted', () => {
    expect(repo.last6MonthsSummary(user, febMarStart, marchEnd)).toEqual([
      { year: 2025, month: 2, income: 0, expenses: 80 },
      { year: 2025, month: 3, income: 2000, expenses: 150 }
    ])
  })

  it('last3MonthsAvgByCategory: monthly average per category', () => {
    const food = repo.last3MonthsAvgByCategory(user, febMarStart, marchEnd).find(r => r.categoryId === childFood)!
    expect(food.avgMonthly).toBe(115)
  })

  it('last3MonthsTransactions: grouped by month with amounts', () => {
    const result = repo.last3MonthsTransactions(user, febMarStart, marchEnd)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.total).sort((a, b) => a - b)).toEqual([80, 150])
  })

  it('currentBudgets: budgets of the month with category name', () => {
    expect(repo.currentBudgets(user, 2025, 3)).toEqual([{ categoryId: childFood, name: 'Comida', amount: 200 }])
  })

  it('dailyExpenses: grouped by day of month', () => {
    expect(repo.dailyExpenses(user, marchStart, marchEnd)).toEqual([{ _id: 15, amount: 150 }])
  })
})
