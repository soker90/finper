import { eq, and, lte, gte, desc, inArray } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
import { db } from '../../db'
const { supplyReadings } = schema

type NewReading = typeof supplyReadings.$inferInsert
type Reading = typeof supplyReadings.$inferSelect

// startDate/endDate viajan como número (ms) desde el validator Joi;
// la columna es timestamp_ms → Drizzle espera Date al insertar.

export const createSupplyReadingRepository = (db: DB) => ({
  findBySupplyAndUser: (supplyId: string, user: string): Reading[] =>
    db.select().from(supplyReadings)
      .where(and(eq(supplyReadings.supplyId, supplyId), eq(supplyReadings.user, user)))
      .orderBy(desc(supplyReadings.startDate), desc(supplyReadings.endDate))
      .all(),

  findLastBySupply: (supplyId: string, user: string): Reading | undefined =>
    db.select().from(supplyReadings)
      .where(and(eq(supplyReadings.supplyId, supplyId), eq(supplyReadings.user, user)))
      .orderBy(desc(supplyReadings.endDate))
      .get(),

  // ventana del último año: endDate ≤ to  y  startDate ≥ from
  findInLastYear: (supplyId: string, user: string, to: number, from: number): Reading[] =>
    db.select().from(supplyReadings)
      .where(and(
        eq(supplyReadings.supplyId, supplyId),
        eq(supplyReadings.user, user),
        lte(supplyReadings.endDate, to),
        gte(supplyReadings.startDate, from)
      ))
      .orderBy(desc(supplyReadings.endDate))
      .all(),

  findById: (id: string, user: string): Reading | undefined =>
    db.select().from(supplyReadings).where(and(eq(supplyReadings.id, id), eq(supplyReadings.user, user))).get(),

  create: (data: Omit<NewReading, 'id'>): Reading =>
    db.insert(supplyReadings).values({ ...data, id: generateId() } as NewReading).returning().get(),

  update: (id: string, user: string, data: Partial<Omit<NewReading, 'id' | 'user'>>): Reading | undefined =>
    db.update(supplyReadings).set(data).where(and(eq(supplyReadings.id, id), eq(supplyReadings.user, user))).returning().get(),

  delete: (id: string, user: string): Reading | undefined =>
    db.delete(supplyReadings).where(and(eq(supplyReadings.id, id), eq(supplyReadings.user, user))).returning().get(),

  deleteBySupplyId: (supplyId: string): void => {
    db.delete(supplyReadings).where(eq(supplyReadings.supplyId, supplyId)).run()
  },

  deleteBySupplyIds: (supplyIds: string[]): void => {
    if (supplyIds.length === 0) return
    db.delete(supplyReadings).where(inArray(supplyReadings.supplyId, supplyIds)).run()
  }
})

export const supplyReadingRepository = createSupplyReadingRepository(db)
