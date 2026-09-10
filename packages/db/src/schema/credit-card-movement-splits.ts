import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { creditCardMovements } from './credit-card-movements'
import { categories } from './categories'

export const creditCardMovementSplits = sqliteTable('credit_card_movement_splits', {
  id: text('id').primaryKey(),
  movementId: text('movement_id').notNull().references(() => creditCardMovements.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  movementIdx: index('cc_mov_splits_movement_idx').on(table.movementId),
  userCategoryIdx: index('cc_mov_splits_user_category_idx').on(table.user, table.categoryId),
}))
