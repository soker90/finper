import {  sqliteTable, text, integer, real, uniqueIndex, index  } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { categories } from './categories';

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  amount: real('amount').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  userMonthYearCategoryIdx: uniqueIndex('user_month_year_category_idx').on(table.user, table.month, table.year, table.categoryId),
}));
