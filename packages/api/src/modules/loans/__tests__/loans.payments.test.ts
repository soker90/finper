import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createLoansRepository } from '../loans.repository'
import { LoansService } from '../loans.service'
import { generateUsername } from '../../../../test/generate-values'
import { ERROR_MESSAGE } from '../../../i18n'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq, and } from 'drizzle-orm'

const { loans, loanPayments, loanEvents, transactions, categories, accounts, users } = schema

describe('Loans Service (Part B - payments)', () => {
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
    db.insert(users).values({ id: 'loan-b-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
    accountId = generateId()
    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Hipoteca', type: 'expense', user }).run()
  })

  afterAll(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(loanPayments).where(eq(loanPayments.user, user)).run()
    db.delete(loanEvents).where(eq(loanEvents.user, user)).run()
    db.delete(loans).where(eq(loans.user, user)).run()
    db.delete(categories).where(eq(categories.user, user)).run()
    db.delete(accounts).where(eq(accounts.user, user)).run()
    db.delete(users).where(eq(users.username, user)).run()
    closeTestDb(db)
  })

  beforeEach(() => {
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 1000, user }).run()
  })

  afterEach(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(loanPayments).where(eq(loanPayments.user, user)).run()
    db.delete(loanEvents).where(eq(loanEvents.user, user)).run()
    db.delete(loans).where(eq(loans.user, user)).run()
    db.delete(accounts).where(eq(accounts.user, user)).run()
  })

  const insertLoan = (overrides: Record<string, any> = {}) => {
    const id = generateId()
    db.insert(loans).values({
      id,
      name: 'Mortgage',
      initialAmount: overrides.initialAmount ?? 10000,
      pendingAmount: overrides.pendingAmount ?? 10000,
      interestRate: overrides.interestRate ?? 12,
      startDate: overrides.startDate ?? Date.UTC(2025, 0, 1),
      monthlyPayment: overrides.monthlyPayment ?? 500,
      initialEstimatedCost: overrides.initialEstimatedCost ?? 11000,
      accountId,
      categoryId,
      user
    }).run()
    return id
  }

  const balanceOf = () => db.select().from(accounts).where(eq(accounts.id, accountId)).get()!.balance
  const movements = () => db.select().from(transactions).where(eq(transactions.user, user)).all()

  describe('payOrdinary', () => {
    it('creates ordinary payment, lowers pendingAmount, deducts balance and creates a movement (addMovement default true)', () => {
      const id = insertLoan()
      const payment = service.payOrdinary(id, user)

      expect(payment.type).toBe('ordinary')
      expect(payment.amount).toBe(500)
      expect(payment.principal).toBe(400)
      expect(payment.interest).toBe(100)
      expect(payment.pendingCapital).toBe(9600)

      expect(repository.findById(id, user)!.pendingAmount).toBe(9600)
      expect(balanceOf()).toBe(500)
      expect(movements()).toHaveLength(1)
      expect(movements()[0].amount).toBe(500)
    })

    it('with addMovement:false does not touch balance nor create a movement', () => {
      const id = insertLoan()
      service.payOrdinary(id, user, { addMovement: false })
      expect(balanceOf()).toBe(1000)
      expect(movements()).toHaveLength(0)
    })

    it('throws ALREADY_PAID when pendingAmount <= 0', () => {
      const id = insertLoan({ pendingAmount: 0 })
      expect(() => service.payOrdinary(id, user)).toThrow(
        expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.LOAN.ALREADY_PAID }) })
      )
    })

    it('with custom amount distributes interest as amount - principal', () => {
      const id = insertLoan()
      const payment = service.payOrdinary(id, user, { amount: 550 })
      expect(payment.amount).toBe(550)
      expect(payment.principal).toBe(400)
      expect(payment.interest).toBe(150)
    })
  })

  describe('payExtraordinary', () => {
    it('reduceTerm: creates extraordinary payment, lowers pendingAmount, keeps monthlyPayment, deducts balance', () => {
      const id = insertLoan()
      const payment = service.payExtraordinary(id, 1000, 'reduceTerm', user)

      expect(payment.type).toBe('extraordinary')
      expect(payment.principal).toBe(1000)
      expect(repository.findById(id, user)!.pendingAmount).toBe(9000)
      expect(repository.findById(id, user)!.monthlyPayment).toBe(500)
      expect(balanceOf()).toBe(0)
    })

    it('reduceQuota: recalculates monthlyPayment to a lower value', () => {
      const id = insertLoan()
      service.payExtraordinary(id, 2000, 'reduceQuota', user)
      expect(repository.findById(id, user)!.monthlyPayment).toBeLessThan(500)
    })

    it('addMovement:false does not change balance', () => {
      const id = insertLoan()
      service.payExtraordinary(id, 1000, 'reduceTerm', user, false)
      expect(balanceOf()).toBe(1000)
    })

    it('amount > pendingAmount: principal capped, excess goes to interest', () => {
      const id = insertLoan({ pendingAmount: 500 })
      const payment = service.payExtraordinary(id, 800, 'reduceTerm', user)
      expect(payment.principal).toBe(500)
      expect(payment.interest).toBe(300)
      expect(repository.findById(id, user)!.pendingAmount).toBe(0)
    })
  })

  describe('deletePayment', () => {
    it('reverses balance, removes the movement (ordinary) and recalculates the chain', () => {
      const id = insertLoan()
      const payment = service.payOrdinary(id, user)
      service.deletePayment(id, payment._id, user)

      expect(balanceOf()).toBe(1000)
      expect(movements()).toHaveLength(0)
      expect(repository.findPaymentsByLoan(id, user)).toHaveLength(0)
      expect(repository.findById(id, user)!.pendingAmount).toBe(10000)
    })

    it('throws PAYMENT_NOT_FOUND when the payment does not exist', () => {
      const id = insertLoan()
      expect(() => service.deletePayment(id, '62a39498c4497e1fe3c2bf35', user)).toThrow(
        expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.LOAN.PAYMENT_NOT_FOUND }) })
      )
    })
  })

  describe('editPayment', () => {
    it('adjusts balance by the diff, recalculates chain and updates the linked movement', () => {
      const id = insertLoan()
      const payment = service.payOrdinary(id, user)

      const edited = service.editPayment(id, payment._id, { amount: 600, principal: 500 }, user)
      expect(edited.amount).toBe(600)
      expect(balanceOf()).toBe(400)
      expect(repository.findById(id, user)!.pendingAmount).toBe(9500)
      const movs = db.select().from(transactions).where(and(eq(transactions.user, user), eq(transactions.amount, 600))).all()
      expect(movs).toHaveLength(1)
    })
  })
})
