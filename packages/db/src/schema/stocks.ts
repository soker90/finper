import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const stocks = sqliteTable('stocks', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  ticker: text('ticker').notNull(),
  name: text('name').notNull(),
  shares: real('shares').notNull(),
  price: real('price').notNull(),
  type: text('type').notNull(), // 'buy' | 'sell' | 'dividend'
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  user: text('user').notNull(),
});
