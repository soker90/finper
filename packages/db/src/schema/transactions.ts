import { sqliteTable, text, primaryKey, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';
import { categories } from './categories';
import { stores } from './stores';
import { subscriptions } from './subscriptions';



export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'expense' | 'income' | 'not_computable'
  accountId: text('account_id').notNull().references(() => accounts.id),
  note: text('note'),
  storeId: text('store_id').references(() => stores.id),
  subscriptionId: text('subscription_id').references(() => subscriptions.id),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  userTypeDateIdx: index('transactions_user_type_date_idx').on(table.user, table.type, table.date),
  userIdx: index('transactions_user_idx').on(table.user),
}));


