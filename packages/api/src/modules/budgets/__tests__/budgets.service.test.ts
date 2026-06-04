import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createBudgetsRepository } from '../budgets.repository'
import { BudgetsService } from '../budgets.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { budgets, categories, transactions, accounts, users } = schema

describe('Budgets Service (Part A)', () => {
  let db: DB
  let repository: ReturnType<typeof createBudgetsRepository>
  let service: BudgetsService
  let user: string
  let accountId: string
  let parentId: string
  let childExpenseId: string
  let childIncomeId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createBudgetsRepository(db)
    service = new BudgetsService(repository)
    user = generateUsername()
    db.insert(users).values({ id: 'budget-a-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()

    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user }).run()

    parentId = generateId()
    db.insert(categories).values({ id: parentId, name: 'Casa', type: 'expense', budgetRuleClass: 'needs', user }).run()
    childExpenseId = generateId()
    db.insert(categories).values({ id: childExpenseId, name: 'Luz', type: 'expense', parentId, budgetRuleClass: 'none', user }).run()
    childIncomeId = generateId()
    db.insert(categories).values({ id: childIncomeId, name: 'Nómina', type: 'income', parentId: null, budgetRuleClass: 'none', user }).run()
  })

  afterAll(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(budgets).where(eq(budgets.user, user)).run()
    db.delete(categories).where(eq(categories.user, user)).run()
    db.delete(accounts).where(eq(accounts.user, user)).run()
    db.delete(users).where(eq(users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(budgets).where(eq(budgets.user, user)).run()
  })

  describe('editBudget', () => {
    it('inserts a budget when none exists', () => {
      const result = service.editBudget({ category: childExpenseId, year: 2025, month: 3, user, amount: 120 })
      expect(result.amount).toBe(120)
      expect(result.category).toBe(childExpenseId)
      expect(repository.findBudget(childExpenseId, 2025, 3, user)).toBeDefined()
    })

    it('updates the amount when the budget already exists (upsert)', () => {
      service.editBudget({ category: childExpenseId, year: 2025, month: 3, user, amount: 120 })
      const result = service.editBudget({ category: childExpenseId, year: 2025, month: 3, user, amount: 200 })
      expect(result.amount).toBe(200)
      expect(repository.findBudgets(user, 2025, 3)).toHaveLength(1)
    })
  })

  describe('copy', () => {
    it('returns false when origin month has no budgets', () => {
      expect(service.copy({ monthOrigin: 1, yearOrigin: 2025, month: 2, year: 2025, user })).toBe(false)
    })

    it('copies budgets from origin to destination', () => {
      service.editBudget({ category: childExpenseId, year: 2025, month: 1, user, amount: 100 })
      const ok = service.copy({ monthOrigin: 1, yearOrigin: 2025, month: 2, year: 2025, user })
      expect(ok).toBe(true)
      const dest = repository.findBudget(childExpenseId, 2025, 2, user)
      expect(dest?.amount).toBe(100)
    })

    it('overwrites existing destination budgets (upsert)', () => {
      service.editBudget({ category: childExpenseId, year: 2025, month: 1, user, amount: 100 })
      service.editBudget({ category: childExpenseId, year: 2025, month: 2, user, amount: 999 })
      service.copy({ monthOrigin: 1, yearOrigin: 2025, month: 2, year: 2025, user })
      expect(repository.findBudget(childExpenseId, 2025, 2, user)?.amount).toBe(100)
    })
  })

  describe('getCategoriesWithBudgets', () => {
    it('returns child categories with inherited budgetRuleClass and their budgets', () => {
      service.editBudget({ category: childExpenseId, year: 2025, month: 3, user, amount: 120 })
      const result = service.getCategoriesWithBudgets({ user, year: 2025, month: NaN })

      const luz = result.find(c => c._id === childExpenseId)!
      expect(luz.budgetRuleClass).toBe('needs')
      expect(luz.budgets).toEqual([{ month: 3, amount: 120, year: 2025 }])

      const nomina = result.find(c => c._id === childIncomeId)
      expect(nomina).toBeUndefined()
    })
  })

  describe('getTransactionsSumByMonth', () => {
    it('groups transaction totals by month (Europe/Madrid) and category', () => {
      const marchDate = Date.UTC(2025, 2, 15, 12, 0, 0)
      db.insert(transactions).values({ id: generateId(), date: marchDate, categoryId: childExpenseId, amount: 50, type: 'expense', accountId, note: null, storeId: null, subscriptionId: null, tags: [], user }).run()
      db.insert(transactions).values({ id: generateId(), date: marchDate, categoryId: childExpenseId, amount: 30, type: 'expense', accountId, note: null, storeId: null, subscriptionId: null, tags: [], user }).run()

      const result = service.getTransactionsSumByMonth({ user, year: 2025, month: NaN })
      const march = result.find(r => r._id.month === 3 && r._id.category === childExpenseId)
      expect(march).toBeDefined()
      expect(march!.total).toBe(80)
    })
  })
})
