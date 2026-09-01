import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { users } from './users'

export const passkeys = sqliteTable('passkeys', {
  id: text('id').primaryKey(),
  user: text('user').notNull().references(() => users.username),
  credentialId: text('credential_id').notNull(),
  publicKey: text('public_key').notNull(),
  counter: integer('counter').notNull().default(0),
  transports: text('transports'),
  deviceLabel: text('device_label'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  credentialIdIdx: uniqueIndex('passkeys_credential_id_idx').on(table.credentialId),
}))
