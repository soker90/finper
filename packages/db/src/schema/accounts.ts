import {  sqliteTable, text, real, integer  } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  bank: text('bank').notNull(),
  balance: real('balance').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  user: text('user').notNull().references(() => users.username),
});
