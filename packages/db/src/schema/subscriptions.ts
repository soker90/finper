import {  sqliteTable, text, integer, real  } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';
import { categories } from './categories';

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency'),
  cycle: integer('cycle').notNull(),
  nextPaymentDate: integer('next_payment_date', { mode: 'timestamp_ms' }),
  categoryId: text('category_id').notNull().references(() => categories.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  logoUrl: text('logo_url'),
  user: text('user').notNull().references(() => users.username),
});

export const subscriptionCandidates = sqliteTable('subscription_candidates', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  subscriptionIds: text('subscription_ids', { mode: 'json' }).$type<string[]>().notNull(),
  user: text('user').notNull().references(() => users.username),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
