import { eq, and } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
import { db } from '../db'
const { supplies } = schema

type NewSupply = typeof supplies.$inferInsert
type Supply = typeof supplies.$inferSelect

export const createSupplyRepository = (db: DB) => ({
  findByUser: (user: string): Supply[] =>
    db.select().from(supplies).where(eq(supplies.user, user)).all(),

  findByPropertyId: (propertyId: string): Supply[] =>
    db.select().from(supplies).where(eq(supplies.propertyId, propertyId)).all(),

  findById: (id: string, user: string): Supply | undefined =>
    db.select().from(supplies).where(and(eq(supplies.id, id), eq(supplies.user, user))).get(),

  create: (data: Omit<NewSupply, 'id'>): Supply =>
    db.insert(supplies).values({ ...data, id: generateId() }).returning().get(),

  update: (id: string, user: string, data: Partial<Omit<NewSupply, 'id' | 'user'>>): Supply | undefined =>
    db.update(supplies).set(data).where(and(eq(supplies.id, id), eq(supplies.user, user))).returning().get(),

  delete: (id: string, user: string): Supply | undefined =>
    db.delete(supplies).where(and(eq(supplies.id, id), eq(supplies.user, user))).returning().get(),

  deleteByPropertyId: (propertyId: string): void => {
    db.delete(supplies).where(eq(supplies.propertyId, propertyId)).run()
  }
})

export const supplyRepository = createSupplyRepository(db)
