import { eq, and, asc } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
import { db } from '../db'
const { properties } = schema

type NewProperty = typeof properties.$inferInsert
type Property = typeof properties.$inferSelect

export const createPropertyRepository = (db: DB) => ({
  findByUser: (user: string): Property[] =>
    db.select().from(properties).where(eq(properties.user, user)).orderBy(asc(properties.name)).all(),

  findById: (id: string, user: string): Property | undefined =>
    db.select().from(properties).where(and(eq(properties.id, id), eq(properties.user, user))).get(),

  create: (data: Omit<NewProperty, 'id'>): Property =>
    db.insert(properties).values({ ...data, id: generateId() }).returning().get(),

  update: (id: string, user: string, data: Partial<Omit<NewProperty, 'id' | 'user'>>): Property | undefined =>
    db.update(properties).set(data).where(and(eq(properties.id, id), eq(properties.user, user))).returning().get(),

  delete: (id: string, user: string): Property | undefined =>
    db.delete(properties).where(and(eq(properties.id, id), eq(properties.user, user))).returning().get()
})

export const propertyRepository = createPropertyRepository(db)
