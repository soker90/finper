import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';

// Una tarjeta de crédito lleva asociada una cuenta bancaria (accountId) que
// es la que finalmente asume el cargo cuando se liquida la deuda. Los
// movimientos de la tarjeta (ver credit-card-movements.ts) se registran de
// forma independiente y solo generan una fila real en `transactions` (con
// accountId = card.accountId) en el momento del pago (payDebt), replicando
// el ciclo pending -> paid que usan los `yields`/settlements.
export const creditCards = sqliteTable('credit_cards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  limit: real('limit'),
  // Banco cuyo logo se muestra para la tarjeta (clave de components/icons/BankIcon
  // en el cliente). Si es null, el cliente usa el banco de la cuenta asociada.
  logoBank: text('logo_bank'),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  userIdx: index('credit_cards_user_idx').on(table.user),
}));
