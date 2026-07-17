import { sqliteTable, text, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';

// Un Rendimiento es una entidad genérica a la que se enlazan transacciones
// ya existentes. El "type" determina cómo se interpretan esas transacciones:
//   - 'interest': ingresos (abono bruto) menos gastos (impuesto retenido).
//   - 'cashback': solo ingresos (abono); los gastos enlazados son los recibos.
export const yields = sqliteTable('yields', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'interest' | 'cashback'
  accountId: text('account_id').notNull().references(() => accounts.id),
  categoryIds: text('category_ids', { mode: 'json' }).$type<string[]>().notNull().default([]),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  userAccountTypeIdx: uniqueIndex('yields_user_account_type_idx').on(table.user, table.accountId, table.type),
}));

export const yieldSettlements = sqliteTable('yield_settlements', {
  id: text('id').primaryKey(),
  yieldId: text('yield_id').notNull().references(() => yields.id),
  user: text('user').notNull().references(() => users.username),
  tae: real('tae'), // real, nullable
  averageBalance: real('average_balance'), // real, nullable
}, (table) => ({
  // Lets transactions reference (yield_settlement_id, yield_id) together, so
  // the DB itself rejects a transaction whose settlement belongs to a
  // different yield than the one it's linked to.
  idYieldIdIdx: uniqueIndex('yield_settlements_id_yield_id_idx').on(table.id, table.yieldId),
}));
