import { eq, and, asc } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'

const { loans, loanPayments, loanEvents } = schema

export type LoanRow = typeof loans.$inferSelect
export type LoanPaymentRow = typeof loanPayments.$inferSelect
export type LoanEventRow = typeof loanEvents.$inferSelect

export const createLoansRepository = (db: DB) => ({
  findByUser: (user: string): LoanRow[] =>
    db.select().from(loans).where(eq(loans.user, user)).all(),

  findById: (id: string, user: string): LoanRow | undefined =>
    db.select().from(loans).where(and(eq(loans.id, id), eq(loans.user, user))).get(),

  exists: (id: string, user: string): boolean =>
    Boolean(db.select({ id: loans.id }).from(loans).where(and(eq(loans.id, id), eq(loans.user, user))).get()),

  findEventsByLoan: (loanId: string, user: string): LoanEventRow[] =>
    db.select().from(loanEvents)
      .where(and(eq(loanEvents.loanId, loanId), eq(loanEvents.user, user)))
      .orderBy(asc(loanEvents.date))
      .all(),

  findPaymentsByLoan: (loanId: string, user: string): LoanPaymentRow[] =>
    db.select().from(loanPayments)
      .where(and(eq(loanPayments.loanId, loanId), eq(loanPayments.user, user)))
      .orderBy(asc(loanPayments.date))
      .all(),

  create: (data: Omit<LoanRow, 'id'>): LoanRow => {
    const id = generateId()
    return db.insert(loans).values({ ...data, id }).returning().get()
  },

  update: (id: string, data: Partial<Omit<LoanRow, 'id' | 'user'>>): LoanRow | undefined =>
    db.update(loans).set(data).where(eq(loans.id, id)).returning().get(),

  // Borrado en cascada manual (loan + sus pagos + sus eventos).
  delete: (id: string): void => {
    db.delete(loanPayments).where(eq(loanPayments.loanId, id)).run()
    db.delete(loanEvents).where(eq(loanEvents.loanId, id)).run()
    db.delete(loans).where(eq(loans.id, id)).run()
  }
})
