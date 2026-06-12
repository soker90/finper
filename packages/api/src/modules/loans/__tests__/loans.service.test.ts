import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createLoansRepository } from '../loans.repository'
import { LoansService } from '../loans.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { loans, loanPayments, loanEvents, categories, accounts, users } = schema

describe('Loans Service (Part A)', () => {
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
    db.insert(users).values({ id: 'loan-user', username: user, password: 'pwd', createdAt: new Date() }).run()
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

  const baseData = () => ({
    name: 'Mortgage',
    initialAmount: 100000,
    interestRate: 3.5,
    startDate: Date.UTC(2025, 0, 1),
    monthlyPayment: 600,
    account: accountId,
    category: categoryId,
    user
  })

  describe('createLoan', () => {
    it('sets pendingAmount = initialAmount and computes initialEstimatedCost > 0', () => {
      const loan = service.createLoan(baseData())
      expect(loan.pendingAmount).toBe(100000)
      expect(loan.initialEstimatedCost).toBeGreaterThan(0)
      expect(loan.account).toBe(accountId)
      expect(loan.category).toBe(categoryId)
      expect(loan._id).toBeDefined()
    })
  })

  describe('getLoans', () => {
    it('returns serialized loans of the user', () => {
      service.createLoan(baseData())
      const list = service.getLoans(user)
      expect(list).toHaveLength(1)
      expect(list[0].account).toBe(accountId)
    })
  })

  describe('getLoanDetail', () => {
    it('returns stats and amortizationTable', () => {
      const created = service.createLoan(baseData())
      const detail = service.getLoanDetail(created._id, user)
      expect(detail.stats).toBeDefined()
      expect(Array.isArray(detail.amortizationTable)).toBe(true)
      expect(detail.amortizationTable.length).toBeGreaterThan(0)
      expect(detail.stats.currentRate).toBe(3.5)
      expect(detail.stats.currentPayment).toBe(600)
    })

    it('reflects the latest event in stats.currentRate / currentPayment', () => {
      const created = service.createLoan(baseData())
      db.insert(loanEvents).values({
        id: generateId(), loanId: created._id, date: Date.now() - 1000, newRate: 4.5, newPayment: 650, user
      }).run()

      const detail = service.getLoanDetail(created._id, user)
      expect(detail.stats.currentRate).toBe(4.5)
      expect(detail.stats.currentPayment).toBe(650)
    })
  })

  describe('editLoan', () => {
    it('updates name, account and category', () => {
      const created = service.createLoan(baseData())
      const otherAccount = generateId()
      db.insert(accounts).values({ id: otherAccount, name: 'Savings', bank: 'BankB', balance: 0, user }).run()

      const updated = service.editLoan(created._id, { name: 'Renamed', account: otherAccount, category: categoryId })
      expect(updated.name).toBe('Renamed')
      expect(updated.account).toBe(otherAccount)
    })
  })

  describe('deleteLoan', () => {
    it('removes the loan and its payments and events', () => {
      const created = service.createLoan(baseData())
      db.insert(loanPayments).values({
        id: generateId(),
        loanId: created._id,
        date: Date.now(),
        amount: 600,
        interest: 100,
        principal: 500,
        accumulatedPrincipal: 500,
        pendingCapital: 99500,
        type: 'ordinary',
        user
      }).run()
      db.insert(loanEvents).values({
        id: generateId(), loanId: created._id, date: Date.now(), newRate: 4, newPayment: 620, user
      }).run()

      service.deleteLoan(created._id)

      expect(repository.findById(created._id, user)).toBeUndefined()
      expect(repository.findPaymentsByLoan(created._id, user)).toHaveLength(0)
      expect(repository.findEventsByLoan(created._id, user)).toHaveLength(0)
    })
  })
})
