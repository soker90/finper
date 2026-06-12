import { eq, and, asc } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
import { db as sqliteDb } from '../../db'

const { stocks } = schema

export const createStocksRepository = (db: DB) => ({
  create: (stock: Omit<typeof stocks.$inferInsert, 'id'>): typeof stocks.$inferSelect => {
    return db.insert(stocks).values({ ...stock, id: generateId() }).returning().get()
  },
  delete: (id: string, user: string): number => {
    return db.delete(stocks).where(and(eq(stocks.id, id), eq(stocks.user, user))).run().changes
  },
  findAllByUser: (user: string): typeof stocks.$inferSelect[] => {
    return db.select().from(stocks).where(eq(stocks.user, user)).orderBy(asc(stocks.date)).all()
  }
})

export const stocksRepository = createStocksRepository(sqliteDb)
