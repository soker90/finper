import path from 'node:path'
import { createDb, schema, type DB } from '@soker90/finper-db'
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

// Tablas de datos (todas referencian users.username). cleanAll las vacía
// preservando la tabla users. Las FK se desactivan durante el borrado para no
// depender del orden (incluido el self-FK de categories.parentId).
const DATA_TABLES = [
  schema.transactions,
  schema.subscriptionCandidates,
  schema.subscriptions,
  schema.loanPayments,
  schema.loanEvents,
  schema.loans,
  schema.budgets,
  schema.stocks,
  schema.pensions,
  schema.debts,
  schema.goals,
  schema.categories,
  schema.stores,
  schema.accounts,
]

/**
 * Vacía todas las tablas de datos preservando users.
 * Pensado para afterEach en tests de ruta que comparten el usuario del token.
 */
export function cleanAll (db: DB): void {
  const client = (db as any).$client ?? (db as any).session?.client
  client?.pragma('foreign_keys = OFF')
  try {
    for (const table of DATA_TABLES) {
      db.delete(table).run()
    }
  } finally {
    client?.pragma('foreign_keys = ON')
  }
}
