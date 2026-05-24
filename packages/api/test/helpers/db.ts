import path from 'node:path'
import { createDb, type DB } from '@soker90/finper-db'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

/**
 * Crea una base de datos SQLite en memoria con todas las migraciones aplicadas.
 * Cada llamada produce una BD nueva y aislada.
 *
 * Uso típico en un test:
 *   let db: DB;
 *   beforeEach(() => { db = createTestDb(); });
 *   afterEach(() => { closeTestDb(db); });
 */
export function createTestDb (): DB {
  const db = createDb(':memory:')
  migrate(db, {
    migrationsFolder: path.resolve(__dirname, '../../../db/drizzle'),
  })
  return db
}

/**
 * Cierra una BD de test. Llamar en afterEach para liberar memoria.
 */
export function closeTestDb (db: DB): void {
  // better-sqlite3 expone .close() en la instancia nativa.
  // Drizzle no expone el handle directamente, así que se accede vía session.
  const sqlite = (db as any).$client ?? (db as any).session?.client
  if (sqlite?.close) sqlite.close()
}
