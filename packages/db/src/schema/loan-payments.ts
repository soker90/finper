import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { loans } from './loans';

export const loanEvents = sqliteTable('loan_events', {
  id: text('id').primaryKey(),
  loanId: text('loan_id').notNull(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  newRate: real('new_rate').notNull(),
  newPayment: real('new_payment').notNull(),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  loanUserIdx: index('loan_events_loan_user_idx').on(table.loanId, table.user),
  userIdx: index('loan_events_user_idx').on(table.user),
}));

export const loanPayments = sqliteTable('loan_payments', {
  id: text('id').primaryKey(),
  loanId: text('loan_id').notNull().references(() => loans.id),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  amount: real('amount').notNull(),
  interest: real('interest').default(0),
  principal: real('principal').notNull(),
  accumulatedPrincipal: real('accumulated_principal').notNull(),
  pendingCapital: real('pending_capital').notNull(),
  type: text('type').notNull().default('ordinary'), // 'ordinary' | 'extraordinary'
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  loanUserDateIdx: index('loan_payments_loan_user_date_idx').on(table.loanId, table.user, table.date),
  userIdx: index('loan_payments_user_idx').on(table.user),
}));
