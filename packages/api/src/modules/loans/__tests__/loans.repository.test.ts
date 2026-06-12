import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createLoansRepository } from '../loans.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { loans, loanPayments, loanEvents, categories, accounts, users } = schema

describe('Loans Repository (Part A)', () => {
  let db: DB
  let repository: ReturnType<typeof createLoansRepository>
  let user: string
  let accountId: string
  let categoryId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createLoansRepository(db)
    user = generateUsername()
    db.insert(users).values({ id: 'loan-repo-user', username: user, password: 'pwd', createdAt: new Date() }).run()
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

  const createLoan = () => repository.create({
    name: 'L',
    initialAmount: 1000,
    pendingAmount: 1000,
    interestRate: 3,
    startDate: Date.UTC(2025, 0, 1),
    monthlyPayment: 100,
    initialEstimatedCost: 1050,
    accountId,
    categoryId,
    user
  })

  it('delete cascades to payments and events', () => {
    const loan = createLoan()
    db.insert(loanPayments).values({
      id: generateId(),
      loanId: loan.id,
      date: 1000,
      amount: 100,
      interest: 10,
      principal: 90,
      accumulatedPrincipal: 90,
      pendingCapital: 910,
      type: 'ordinary',
      user
    }).run()
    db.insert(loanEvents).values({ id: generateId(), loanId: loan.id, date: 1000, newRate: 4, newPayment: 110, user }).run()

    repository.delete(loan.id)

    expect(repository.findById(loan.id, user)).toBeUndefined()
    expect(repository.findPaymentsByLoan(loan.id, user)).toHaveLength(0)
    expect(repository.findEventsByLoan(loan.id, user)).toHaveLength(0)
  })

  it('findPaymentsByLoan / findEventsByLoan ordered by date asc', () => {
    const loan = createLoan()
    db.insert(loanPayments).values([
      { id: generateId(), loanId: loan.id, date: 300, amount: 1, interest: 0, principal: 1, accumulatedPrincipal: 1, pendingCapital: 1, type: 'ordinary', user },
      { id: generateId(), loanId: loan.id, date: 100, amount: 1, interest: 0, principal: 1, accumulatedPrincipal: 1, pendingCapital: 1, type: 'ordinary', user }
    ]).run()
    expect(repository.findPaymentsByLoan(loan.id, user).map(p => p.date)).toEqual([100, 300])
  })
})
