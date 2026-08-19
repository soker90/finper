import {  sqliteTable, text, integer, real, index  } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { pensionPlans } from './pension-plans';

export const pensions = sqliteTable('pensions', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull().references(() => pensionPlans.id, { onDelete: 'cascade' }),
  date: integer('date').notNull(),
  employeeAmount: real('employee_amount').notNull(),
  employeeUnits: real('employee_units').notNull(),
  companyAmount: real('company_amount').notNull(),
  companyUnits: real('company_units').notNull(),
  value: real('value').notNull(),
  user: text('user').notNull().references(() => users.username),
}, (table) => ({
  planUserIdx: index('pensions_plan_user_idx').on(table.planId, table.user),
}));
