import {  sqliteTable, text  } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  user: text('user').notNull().references(() => users.username),
});
