import { createDb, type DB } from '@soker90/finper-db'

export const db: DB = createDb(process.env.DATABASE_FILE ?? './finper-dev.db')
