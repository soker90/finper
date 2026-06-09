import { eq, and, desc } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
const { pensions } = schema

type NewPension = typeof pensions.$inferInsert
type Pension = typeof pensions.$inferSelect

export const createPensionsRepository = (db: DB) => ({
  findByUser: (username: string): Pension[] => {
    return db.select()
      .from(pensions)
      .where(eq(pensions.user, username))
      .orderBy(desc(pensions.date))
      .all()
  },

  findById: (id: string, username: string): Pension | undefined => {
    return db.select()
      .from(pensions)
      .where(and(eq(pensions.id, id), eq(pensions.user, username)))
      .get()
  },

  create: (data: Omit<NewPension, 'id' | 'date'> & { date: number }): Pension => {
    const id = generateId()
    return db.insert(pensions).values({ ...data, date: new Date(data.date), id }).returning().get()
  },

  update: (id: string, username: string, data: Partial<Omit<NewPension, 'id' | 'user' | 'date'> & { date?: number }>): Pension | undefined => {
    const payload: any = {}
    for (const [k, v] of Object.entries(data || {})) {
      if (v !== undefined) payload[k] = v
    }
    if (payload.date) payload.date = new Date(payload.date)

    if (Object.keys(payload).length === 0) {
      return db.select()
        .from(pensions)
        .where(and(eq(pensions.id, id), eq(pensions.user, username)))
        .get()
    }

    return db.update(pensions)
      .set(payload)
      .where(and(eq(pensions.id, id), eq(pensions.user, username)))
      .returning()
      .get()
  }
})
