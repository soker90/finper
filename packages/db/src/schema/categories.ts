import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'income' | 'expense' | 'not_computable'
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  parentId: text('parent_id').references((): AnySQLiteColumn => categories.id),
  budgetRuleClass: text('budget_rule_class').notNull().default('none'), // 'needs' | 'wants' | 'savings' | 'none'
  user: text('user').notNull().references(() => users.username),
});
