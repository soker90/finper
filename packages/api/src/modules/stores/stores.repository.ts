import { eq } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
const { stores } = schema

type Store = typeof stores.$inferSelect

export const createStoresRepository = (db: DB) => ({
  // Sin orderBy: 1:1 con el viejo StoreModel.find({ user }, '_id name').
  findByUser: (user: string): Store[] =>
    db.select().from(stores).where(eq(stores.user, user)).all(),

  create: (data: { name: string, user: string }): Store => {
    const id = generateId()
    return db.insert(stores).values({ ...data, id }).returning().get()
  }
})
