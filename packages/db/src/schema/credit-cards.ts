import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';

export const creditCards = sqliteTable('credit_cards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  limit: real('limit'),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  userIdx: index('credit_cards_user_idx').on(table.user),
}));
