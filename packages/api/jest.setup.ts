import path from 'node:path'
import os from 'node:os'
import { createDb } from '@soker90/finper-db'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const workerId = process.env.JEST_WORKER_ID ?? '0'
process.env.DATABASE_FILE = path.join(os.tmpdir(), `finper-test-${workerId}-${process.pid}.db`)

const db = createDb(process.env.DATABASE_FILE)
migrate(db as any, {
  migrationsFolder: path.resolve(__dirname, '../db/drizzle'),
})
