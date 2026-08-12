import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { creditCards } from './credit-cards';
import { categories } from './categories';
import { stores } from './stores';
import { transactions } from './transactions';

// Ciclo de vida de un movimiento de tarjeta:
//   1. 'pending': el gasto/ingreso se registra en la tarjeta pero todavía NO
//      existe una fila real en `transactions` ni afecta al balance de la
//      cuenta asociada. Es deuda "en curso" de la tarjeta.
//   2. 'paid': al liquidar la deuda (payDebt) se crea una transacción REAL
//      en `transactions` con accountId = credit_cards.account_id, y este
//      movimiento pasa a 'paid' guardando `transactionId` con el id de esa
//      transacción y `paidAt` con la fecha del pago.
// Se modela como tabla separada de `transactions` (en vez de añadir un
// estado 'pending' a transactions) porque los movimientos de tarjeta no
// deben impactar el balance de ninguna cuenta hasta que son pagados, y
// porque muchos nunca llegan a pagarse de forma individual (se agrupan en
// un único pago total o parcial que puede no coincidir 1:1 con cada
// movimiento).
export const creditCardMovements = sqliteTable('credit_card_movements', {
  id: text('id').primaryKey(),
  creditCardId: text('credit_card_id').notNull().references(() => creditCards.id, { onDelete: 'cascade' }),
  date: integer('date').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'expense' | 'income'
  note: text('note'),
  storeId: text('store_id').references(() => stores.id),
  status: text('status').notNull().default('pending'), // 'pending' | 'paid'
  paidAt: integer('paid_at'),
  transactionId: text('transaction_id').references(() => transactions.id),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  cardUserIdx: index('cc_movements_card_user_idx').on(table.creditCardId, table.user),
  userStatusIdx: index('cc_movements_user_status_idx').on(table.user, table.status),
}));
