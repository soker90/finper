import {  sqliteTable, text, integer, real  } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const pensions = sqliteTable('pensions', {
  id: text('id').primaryKey(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  employeeAmount: real('employee_amount').notNull(),
  employeeUnits: real('employee_units').notNull(),
  companyAmount: real('company_amount').notNull(),
  companyUnits: real('company_units').notNull(),
  value: real('value').notNull(),
  user: text('user').notNull().references(() => users.username),
});
