import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { creditCards } from './credit-cards';
import { categories } from './categories';
import { stores } from './stores';
import { transactions } from './transactions';

export const creditCardMovements = sqliteTable('credit_card_movements', {
  id: text('id').primaryKey(),
  creditCardId: text('credit_card_id').notNull().references(() => creditCards.id),
  date: integer('date').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'expense' | 'income'
  note: text('note'),
  storeId: text('store_id').references(() => stores.id),
  status: text('status').notNull().default('pending'), // 'pending' | 'paid'
  paidAt: integer('paid_at'),
  transactionId: text('transaction_id').references(() => transactions.id),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  cardUserIdx: index('cc_movements_card_user_idx').on(table.creditCardId, table.user),
  userStatusIdx: index('cc_movements_user_status_idx').on(table.user, table.status),
}));
