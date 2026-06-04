import { eq, and, asc, desc, sql } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'

const { loans, loanPayments, loanEvents, accounts, transactions } = schema

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
  },

  // --- Parte B: pagos ---

  findLastPayment: (loanId: string, user: string): LoanPaymentRow | undefined =>
    db.select().from(loanPayments)
      .where(and(eq(loanPayments.loanId, loanId), eq(loanPayments.user, user)))
      .orderBy(desc(loanPayments.date))
      .get(),

  findPaymentById: (paymentId: string, loanId: string, user: string): LoanPaymentRow | undefined =>
    db.select().from(loanPayments)
      .where(and(eq(loanPayments.id, paymentId), eq(loanPayments.loanId, loanId), eq(loanPayments.user, user)))
      .get(),

  createPayment: (data: Omit<LoanPaymentRow, 'id'>): LoanPaymentRow => {
    const id = generateId()
    return db.insert(loanPayments).values({ ...data, id }).returning().get()
  },

  updatePayment: (paymentId: string, fields: Partial<Omit<LoanPaymentRow, 'id'>>): LoanPaymentRow | undefined =>
    db.update(loanPayments).set(fields).where(eq(loanPayments.id, paymentId)).returning().get(),

  deletePayment: (paymentId: string): void => {
    db.delete(loanPayments).where(eq(loanPayments.id, paymentId)).run()
  },

  updateLoanFields: (id: string, fields: Partial<Omit<LoanRow, 'id' | 'user'>>): void => {
    db.update(loans).set(fields).where(eq(loans.id, id)).run()
  },

  // Descuenta `amount` del balance (negativo => suma). Devuelve filas afectadas (0 => cuenta no existe).
  deductFromBalance: (accountId: string, amount: number): number => {
    const res = db.update(accounts)
      .set({ balance: sql`ROUND(${accounts.balance} - ${amount}, 2)` })
      .where(eq(accounts.id, accountId))
      .run()
    return res.changes
  },

  // Movimiento (gasto) asociado a un pago: insert directo, 1:1 con el viejo (sin pasar por TransactionService).
  createMovement: (data: { date: number, categoryId: string, amount: number, accountId: string, user: string }): void => {
    db.insert(transactions).values({
      id: generateId(),
      date: data.date,
      categoryId: data.categoryId,
      amount: data.amount,
      type: 'expense',
      accountId: data.accountId,
      note: null,
      storeId: null,
      subscriptionId: null,
      tags: [],
      user: data.user
    }).run()
  },

  // findOneAndDelete por matching {user, account, amount, date} (sólo el primero).
  deleteMovementByMatch: (user: string, accountId: string, amount: number, date: number): void => {
    const movement = db.select({ id: transactions.id }).from(transactions)
      .where(and(
        eq(transactions.user, user),
        eq(transactions.accountId, accountId),
        eq(transactions.amount, amount),
        eq(transactions.date, date)
      )).get()
    if (movement) db.delete(transactions).where(eq(transactions.id, movement.id)).run()
  },

  // findOneAndUpdate por matching {user, account, amount, date} (sólo el primero).
  updateMovementByMatch: (
    match: { user: string, accountId: string, amount: number, date: number },
    fields: { amount?: number, date?: number }
  ): void => {
    const movement = db.select({ id: transactions.id }).from(transactions)
      .where(and(
        eq(transactions.user, match.user),
        eq(transactions.accountId, match.accountId),
        eq(transactions.amount, match.amount),
        eq(transactions.date, match.date)
      )).get()
    if (movement && (fields.amount !== undefined || fields.date !== undefined)) {
      db.update(transactions).set(fields).where(eq(transactions.id, movement.id)).run()
    }
  }
})
