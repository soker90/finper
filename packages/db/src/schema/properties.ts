import {  sqliteTable, text, integer, real  } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const properties = sqliteTable('properties', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  user: text('user').notNull().references(() => users.username),
});

export const supplies = sqliteTable('supplies', {
  id: text('id').primaryKey(),
  name: text('name'),
  type: text('type').notNull(), // 'electricity' | 'water' | 'gas' | 'other'
  propertyId: text('property_id').notNull().references(() => properties.id),
  contractedPowerPeak: real('contracted_power_peak'),
  contractedPowerOffPeak: real('contracted_power_off_peak'),
  currentPricePowerPeak: real('current_price_power_peak'),
  currentPricePowerOffPeak: real('current_price_power_off_peak'),
  currentPriceEnergyPeak: real('current_price_energy_peak'),
  currentPriceEnergyFlat: real('current_price_energy_flat'),
  currentPriceEnergyOffPeak: real('current_price_energy_off_peak'),
  user: text('user').notNull().references(() => users.username),
});

export const supplyReadings = sqliteTable('supply_readings', {
  id: text('id').primaryKey(),
  supplyId: text('supply_id').notNull().references(() => supplies.id),
  startDate: integer('start_date', { mode: 'timestamp_ms' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp_ms' }).notNull(),
  amount: real('amount').notNull(),
  consumption: real('consumption'),
  consumptionPeak: real('consumption_peak'),
  consumptionFlat: real('consumption_flat'),
  consumptionOffPeak: real('consumption_off_peak'),
  user: text('user').notNull().references(() => users.username),
});
