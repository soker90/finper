import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { transactions } from './transactions'
import { categories } from './categories'

export const transactionSplits = sqliteTable('transaction_splits', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  txIdx: index('tx_splits_transaction_idx').on(table.transactionId),
  userCategoryIdx: index('tx_splits_user_category_idx').on(table.user, table.categoryId),
}))
