import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  from: text('from').notNull(),
  date: integer('date', { mode: 'timestamp_ms' }),
  amount: real('amount').notNull(),
  concept: text('concept'),
  type: text('type').notNull(), // 'from' | 'to'
  user: text('user').notNull(),
});
