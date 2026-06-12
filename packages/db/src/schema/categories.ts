import { sqliteTable, text, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  parentId: text('parent_id').references((): AnySQLiteColumn => categories.id),
  budgetRuleClass: text('budget_rule_class').notNull().default('none'),
  user: text('user').notNull().references(() => users.username),
});
