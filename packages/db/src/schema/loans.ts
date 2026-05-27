import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';
import { categories } from './categories';

export const loans = sqliteTable('loans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  initialAmount: real('initial_amount').notNull(),
  pendingAmount: real('pending_amount').notNull(),
  interestRate: real('interest_rate').notNull(),
  startDate: integer('start_date', { mode: 'timestamp_ms' }).notNull(),
  monthlyPayment: real('monthly_payment').notNull(),
  initialEstimatedCost: real('initial_estimated_cost').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
  user: text('user').notNull(),
}, (table) => ({
  userIdx: index('loans_user_idx').on(table.user),
}));
