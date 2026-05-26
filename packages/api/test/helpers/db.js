"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestDb = createTestDb;
exports.closeTestDb = closeTestDb;
const node_path_1 = __importDefault(require("node:path"));
const finper_db_1 = require("@soker90/finper-db");
const migrator_1 = require("drizzle-orm/better-sqlite3/migrator");
/**
 * Crea una base de datos SQLite en memoria con todas las migraciones aplicadas.
 * Cada llamada produce una BD nueva y aislada.
 *
 * Uso típico en un test:
 *   let db: DB;
 *   beforeEach(() => { db = createTestDb(); });
 *   afterEach(() => { closeTestDb(db); });
 */
function createTestDb() {
    const db = (0, finper_db_1.createDb)(':memory:');
    (0, migrator_1.migrate)(db, {
        migrationsFolder: node_path_1.default.resolve(__dirname, '../../../db/drizzle'),
    });
    return db;
}
/**
 * Cierra una BD de test. Llamar en afterEach para liberar memoria.
 */
function closeTestDb(db) {
    // better-sqlite3 expone .close() en la instancia nativa.
    // Drizzle no expone el handle directamente, así que se accede vía session.
    const sqlite = db.$client ?? db.session?.client;
    if (sqlite?.close)
        sqlite.close();
}
