import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createLoansRepository } from '../loans.repository'
import { LoansService } from '../loans.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { loans, loanPayments, loanEvents, categories, accounts, users } = schema

describe('Loans Service (Part C - events / simulation)', () => {
  let db: DB
  let repository: ReturnType<typeof createLoansRepository>
  let service: LoansService
  let user: string
  let accountId: string
  let categoryId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createLoansRepository(db)
    service = new LoansService(repository)
    user = generateUsername()
    db.insert(users).values({ id: 'loan-c-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user }).run()
    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Hipoteca', type: 'expense', user }).run()
  })

  afterAll(() => {
    db.delete(loanPayments).where(eq(loanPayments.user, user)).run()
    db.delete(loanEvents).where(eq(loanEvents.user, user)).run()
    db.delete(loans).where(eq(loans.user, user)).run()
    db.delete(categories).where(eq(categories.user, user)).run()
    db.delete(accounts).where(eq(accounts.user, user)).run()
    db.delete(users).where(eq(users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(loanPayments).where(eq(loanPayments.user, user)).run()
    db.delete(loanEvents).where(eq(loanEvents.user, user)).run()
    db.delete(loans).where(eq(loans.user, user)).run()
  })

  const insertLoan = (overrides: Record<string, any> = {}) => {
    const id = generateId()
    db.insert(loans).values({
      id,
      name: 'Mortgage',
      initialAmount: 10000,
      pendingAmount: overrides.pendingAmount ?? 10000,
      interestRate: 12,
      startDate: Date.UTC(2025, 0, 1),
      monthlyPayment: 500,
      initialEstimatedCost: 11000,
      accountId,
      categoryId,
      user
    }).run()
    return id
  }

  describe('addEvent', () => {
    it('creates the event and updates the loan interestRate and monthlyPayment', () => {
      const id = insertLoan()
      const event = service.addEvent(id, { date: Date.now(), newRate: 4.5, newPayment: 520, user })

      expect(event.newRate).toBe(4.5)
      expect(event.newPayment).toBe(520)
      expect(event.loan).toBe(id)

      const loan = repository.findById(id, user)!
      expect(loan.interestRate).toBe(4.5)
      expect(loan.monthlyPayment).toBe(520)
    })
  })

  describe('simulatePayoff', () => {
    it('throws when lumpSum exceeds pendingAmount', () => {
      const id = insertLoan()
      expect(() => service.simulatePayoff(id, 15000, user)).toThrow(
        expect.objectContaining({ payload: expect.objectContaining({ message: 'lumpSum cannot exceed pendingAmount' }) })
      )
    })

    it('returns optionA (reduceTerm) and optionB (reduceQuota) with savings', () => {
      const id = insertLoan()
      const result = service.simulatePayoff(id, 2000, user)

      expect(result.lumpSum).toBe(2000)
      expect(result.originalMonthsLeft).toBeGreaterThan(0)
      expect(result.originalMonthlyPayment).toBe(500)

      expect(result.optionA.newMonthlyPayment).toBe(500)
      expect(result.optionA.monthlySaving).toBe(0)
      expect(result.optionA.monthsSaved).toBeGreaterThan(0)

      expect(result.optionB.newMonthlyPayment).toBeLessThan(500)
      expect(result.optionB.monthlySaving).toBeGreaterThan(0)
    })
  })
})
