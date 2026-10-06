import { eq, and, desc } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
const { pensionPlans, pensions } = schema

type NewPlan = typeof pensionPlans.$inferInsert
type Plan = typeof pensionPlans.$inferSelect
type NewMovement = typeof pensions.$inferInsert
type Movement = typeof pensions.$inferSelect

export const createPensionPlansRepository = (db: DB) => ({
  findPlansByUser: (user: string): Plan[] => {
    return db.select()
      .from(pensionPlans)
      .where(eq(pensionPlans.user, user))
      .all()
  },

  findPlanById: (id: string, user: string): Plan | undefined => {
    return db.select()
      .from(pensionPlans)
      .where(and(eq(pensionPlans.id, id), eq(pensionPlans.user, user)))
      .get()
  },

  createPlan: (data: Omit<NewPlan, 'id'>): Plan => {
    const id = generateId()
    return db.insert(pensionPlans).values({ ...data, id }).returning().get()
  },

  updatePlan: (id: string, user: string, data: Partial<Omit<NewPlan, 'id' | 'user'>>): Plan | undefined => {
    const payload: any = {}
    for (const [k, v] of Object.entries(data || {})) {
      if (v !== undefined) payload[k] = v
    }

    if (Object.keys(payload).length === 0) {
      return db.select()
        .from(pensionPlans)
        .where(and(eq(pensionPlans.id, id), eq(pensionPlans.user, user)))
        .get()
    }

    return db.update(pensionPlans)
      .set(payload)
      .where(and(eq(pensionPlans.id, id), eq(pensionPlans.user, user)))
      .returning()
      .get()
  },

  deletePlan: (id: string, user: string): boolean => {
    const result = db.delete(pensionPlans)
      .where(and(eq(pensionPlans.id, id), eq(pensionPlans.user, user)))
      .run()
    return (result.changes ?? 0) > 0
  },

  findMovements: (planId: string, user: string): Movement[] => {
    return db.select()
      .from(pensions)
      .where(and(eq(pensions.planId, planId), eq(pensions.user, user)))
      .orderBy(desc(pensions.date))
      .all()
  },

  findMovementById: (id: string, user: string): Movement | undefined => {
    return db.select()
      .from(pensions)
      .where(and(eq(pensions.id, id), eq(pensions.user, user)))
      .get()
  },

  findAllMovementsByUser: (user: string): Movement[] => {
    return db.select()
      .from(pensions)
      .where(eq(pensions.user, user))
      .orderBy(desc(pensions.date))
      .all()
  },

  createMovement: (data: Omit<NewMovement, 'id'>): Movement => {
    const id = generateId()
    return db.insert(pensions).values({ ...data, id }).returning().get()
  },

  updateMovement: (id: string, user: string, data: Partial<Omit<NewMovement, 'id' | 'user' | 'planId'>>): Movement | undefined => {
    const payload: any = {}
    for (const [k, v] of Object.entries(data || {})) {
      if (v !== undefined) payload[k] = v
    }

    if (Object.keys(payload).length === 0) {
      return db.select()
        .from(pensions)
        .where(and(eq(pensions.id, id), eq(pensions.user, user)))
        .get()
    }

    return db.update(pensions)
      .set(payload)
      .where(and(eq(pensions.id, id), eq(pensions.user, user)))
      .returning()
      .get()
  },

  deleteMovement: (id: string, user: string): boolean => {
    const result = db.delete(pensions)
      .where(and(eq(pensions.id, id), eq(pensions.user, user)))
      .run()
    return (result.changes ?? 0) > 0
  },

  transferAssets: ({
    sourcePlanId,
    destinationPlanId,
    user,
    date,
    sourceEmployeeUnits,
    sourceCompanyUnits,
    destinationEmployeeUnits,
    destinationCompanyUnits,
    sourceValue,
    destinationValue
  }: {
    sourcePlanId: string
    destinationPlanId: string
    user: string
    date: number
    sourceEmployeeUnits: number
    sourceCompanyUnits: number
    destinationEmployeeUnits: number
    destinationCompanyUnits: number
    sourceValue: number
    destinationValue: number
  }): [Movement, Movement] => {
    return db.transaction((tx) => {
      const sourceMovement = tx.insert(pensions).values({
        id: generateId(),
        planId: sourcePlanId,
        date,
        employeeAmount: 0,
        employeeUnits: -sourceEmployeeUnits,
        companyAmount: 0,
        companyUnits: -sourceCompanyUnits,
        value: sourceValue,
        user
      }).returning().get()

      const destinationMovement = tx.insert(pensions).values({
        id: generateId(),
        planId: destinationPlanId,
        date,
        employeeAmount: 0,
        employeeUnits: destinationEmployeeUnits,
        companyAmount: 0,
        companyUnits: destinationCompanyUnits,
        value: destinationValue,
        user
      }).returning().get()

      return [sourceMovement, destinationMovement]
    })
  }
})
