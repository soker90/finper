import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export const createDb = (path: string) => {
  const sqlite = new Database(path);
  
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  
  return drizzle(sqlite, { schema });
};

// In production/API the database file path will be provided via env.
export type DB = ReturnType<typeof createDb>;
