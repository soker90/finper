import {  sqliteTable, text, integer, real  } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  from: text('from').notNull(),
  date: integer('date'),
  amount: real('amount').notNull(),
  concept: text('concept'),
  type: text('type').notNull(), // 'from' | 'to'
  user: text('user').notNull().references(() => users.username),
});
