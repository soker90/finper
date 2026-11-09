import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const apiRateLimits = sqliteTable('api_rate_limits', {
  key: text('key').primaryKey(),
  hits: integer('hits').notNull(),
  resetAt: integer('reset_at').notNull()
}, (table) => ({
  resetAtIdx: index('api_rate_limits_reset_at_idx').on(table.resetAt)
}))
