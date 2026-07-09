import { sqliteTable, text, primaryKey, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';
import { categories } from './categories';
import { stores } from './stores';
import { subscriptions } from './subscriptions';
import { yields } from './yields';



export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  date: integer('date').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'expense' | 'income' | 'not_computable'
  accountId: text('account_id').notNull().references(() => accounts.id),
  note: text('note'),
  storeId: text('store_id').references(() => stores.id),
  subscriptionId: text('subscription_id').references(() => subscriptions.id),
  // Enlace opcional a un Rendimiento (ver schema/yields.ts). Un movimiento de
  // ingreso enlazado es el abono; uno de gasto es el impuesto retenido
  // (rendimientos de tipo 'interest') o el recibo que generó el cashback
  // (tipo 'cashback') — el papel se deduce del `type` de la transacción y
  // del `type` del rendimiento, sin necesidad de columnas adicionales.
  yieldId: text('yield_id').references(() => yields.id),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  userTypeDateIdx: index('transactions_user_type_date_idx').on(table.user, table.type, table.date),
  userIdx: index('transactions_user_idx').on(table.user),
}));


