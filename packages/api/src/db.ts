import { createDb, type DB } from '@soker90/finper-db'
import config from './config'

export const db: DB = createDb(config.database.file)
