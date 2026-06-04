import type { DB } from '@soker90/finper-db'
import { schema, generateId, roundMoney } from '@soker90/finper-db'
import { eq, and, ne, sum } from 'drizzle-orm'
import { db } from '../../db'

const { goals, accounts } = schema

type NewGoalInput = Omit<typeof goals.$inferInsert, 'id' | 'user'>
type UpdateGoalInput = Partial<NewGoalInput>

export const createGoalsRepository = (database: DB) => ({
  findAllByUser: (username: string) =>
    database.select().from(goals).where(eq(goals.user, username)).all(),

  findById: (id: string, username: string) => {
    const row = database.select().from(goals)
      .where(and(eq(goals.id, id), eq(goals.user, username)))
      .get()
    return row ?? null
  },

  create: (username: string, data: NewGoalInput) => {
    const row = { ...data, id: generateId(), user: username }
    database.insert(goals).values(row).run()
    return row
  },

  update: (id: string, username: string, data: UpdateGoalInput) => {
    database.update(goals).set(data)
      .where(and(eq(goals.id, id), eq(goals.user, username)))
      .run()
    const updated = database.select().from(goals)
      .where(and(eq(goals.id, id), eq(goals.user, username)))
      .get()
    return updated ?? null
  },

  delete: (id: string, username: string) => {
    const result = database.delete(goals)
      .where(and(eq(goals.id, id), eq(goals.user, username)))
      .run()
    return result.changes > 0
  },

  getTotalAllocatedByUser: (username: string, excludeGoalId?: string): number => {
    const conditions = excludeGoalId
      ? and(eq(goals.user, username), ne(goals.id, excludeGoalId))
      : eq(goals.user, username)

    const row = database
      .select({ total: sum(goals.currentAmount) })
      .from(goals)
      .where(conditions)
      .get()

    return roundMoney(Number(row?.total ?? 0))
  },

  // Suma del balance de cuentas activas (sustituye AccountModel.aggregate del viejo cruce Mongo).
  getActiveAccountsBalance: (username: string): number => {
    const row = database
      .select({ total: sum(accounts.balance) })
      .from(accounts)
      .where(and(eq(accounts.user, username), eq(accounts.isActive, true)))
      .get()

    return roundMoney(Number(row?.total ?? 0))
  }
})

export type GoalsRepository = ReturnType<typeof createGoalsRepository>
export const goalsRepository = createGoalsRepository(db)
