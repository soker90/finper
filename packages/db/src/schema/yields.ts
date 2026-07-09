import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';
import { categories } from './categories';

// Un Rendimiento es una entidad genérica (al estilo de subscriptions) a la
// que se enlazan transacciones ya existentes. El "type" determina cómo se
// interpretan esas transacciones enlazadas al calcular el neto:
//   - 'interest': ingresos (abono bruto) menos gastos (impuesto retenido).
//   - 'cashback': solo ingresos (abono); los gastos enlazados son los
//     recibos que lo generaron, mostrados como contexto, no restados.
export const yields = sqliteTable('yields', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'interest' | 'cashback'
  accountId: text('account_id').notNull().references(() => accounts.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
  user: text('user').notNull().references(() => users.username),
});
