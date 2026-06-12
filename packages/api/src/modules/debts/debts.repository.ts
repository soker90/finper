import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db'

const { debts } = schema

type NewDebtInput = Omit<typeof debts.$inferInsert, 'id' | 'user'>
type UpdateDebtInput = Partial<NewDebtInput>

export const createDebtsRepository = (database: DB) => ({
  findAllByUser: (username: string) =>
    database.select().from(debts).where(eq(debts.user, username)).all(),

  findAllFromUser: (username: string, from: string) =>
    database.select().from(debts)
      .where(and(eq(debts.user, username), eq(debts.from, from)))
      .all(),

  findById: (id: string, username: string) => {
    const row = database.select().from(debts)
      .where(and(eq(debts.id, id), eq(debts.user, username)))
      .get()
    return row ?? null
  },

  create: (username: string, data: NewDebtInput) => {
    const row = { ...data, id: generateId(), user: username }
    database.insert(debts).values(row).run()
    return row
  },

  update: (id: string, username: string, data: UpdateDebtInput) => {
    database.update(debts).set(data)
      .where(and(eq(debts.id, id), eq(debts.user, username)))
      .run()
    const updated = database.select().from(debts)
      .where(and(eq(debts.id, id), eq(debts.user, username)))
      .get()
    return updated ?? null
  },

  delete: (id: string, username: string) => {
    const result = database.delete(debts)
      .where(and(eq(debts.id, id), eq(debts.user, username)))
      .run()
    return result.changes > 0
  }
})

export type DebtsRepository = ReturnType<typeof createDebtsRepository>
export const debtsRepository = createDebtsRepository(db)
