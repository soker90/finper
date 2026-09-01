import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'

export const pensionPlans = sqliteTable('pension_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  userIdx: index('pension_plans_user_idx').on(table.user),
}))
