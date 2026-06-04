import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createBudgetsRepository } from '../budgets.repository'
import { BudgetsService } from '../budgets.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { budgets, categories, transactions, accounts, users } = schema

describe('Budgets Service (Part B - getBudgets)', () => {
  let db: DB
  let service: BudgetsService
  let user: string
  let accountId: string
  let childLuz: string
  let childNomina: string

  beforeAll(() => {
    db = createTestDb()
    service = new BudgetsService(createBudgetsRepository(db))
    user = generateUsername()
    db.insert(users).values({ id: 'budget-b-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user }).run()

    const parentExpense = generateId()
    db.insert(categories).values({ id: parentExpense, name: 'Casa', type: 'expense', budgetRuleClass: 'needs', user }).run()
    childLuz = generateId()
    db.insert(categories).values({ id: childLuz, name: 'Luz', type: 'expense', parentId: parentExpense, budgetRuleClass: 'none', user }).run()

    const parentIncome = generateId()
    db.insert(categories).values({ id: parentIncome, name: 'Trabajo', type: 'income', budgetRuleClass: 'none', user }).run()
    childNomina = generateId()
    db.insert(categories).values({ id: childNomina, name: 'Nómina', type: 'income', parentId: parentIncome, budgetRuleClass: 'none', user }).run()

    service.editBudget({ category: childLuz, year: 2025, month: 3, user, amount: 500 })
    service.editBudget({ category: childNomina, year: 2025, month: 3, user, amount: 1000 })

    const march = Date.UTC(2025, 2, 15, 12, 0, 0)
    db.insert(transactions).values({ id: generateId(), date: march, categoryId: childLuz, amount: 400, type: 'expense', accountId, note: null, storeId: null, subscriptionId: null, tags: [], user }).run()
    db.insert(transactions).values({ id: generateId(), date: march, categoryId: childNomina, amount: 1000, type: 'income', accountId, note: null, storeId: null, subscriptionId: null, tags: [], user }).run()
  })

  afterAll(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(budgets).where(eq(budgets.user, user)).run()
    db.delete(categories).where(eq(categories.user, user)).run()
    db.delete(accounts).where(eq(accounts.user, user)).run()
    db.delete(users).where(eq(users.username, user)).run()
    closeTestDb(db)
  })

  it('returns expenses, incomes (each ending in a totals row) and the 50/30/20 rule', () => {
    const result = service.getBudgets({ user, year: 2025, month: NaN })

    expect(Array.isArray(result.expenses)).toBe(true)
    expect(result.expenses[result.expenses.length - 1].id).toBe('totals')
    expect(result.expenses.find((c: any) => c.id === childLuz).budgetRuleClass).toBe('needs')
    expect(result.incomes[result.incomes.length - 1].id).toBe('totals')

    const { needs, wants, savings, totals } = result.rule503020
    expect(totals.incomeBudgeted).toBe(1000)
    expect(totals.incomeReal).toBe(1000)
    expect(needs.budgeted).toBe(500)
    expect(needs.real).toBe(400)
    expect(needs.percentageBudgeted).toBe(50)
    expect(needs.percentageReal).toBe(40)
    expect(wants.budgeted).toBe(0)
    expect(savings.budgeted).toBe(500)
    expect(savings.real).toBe(600)
  })
})
