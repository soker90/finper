import { eq, and, desc } from 'drizzle-orm'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'
import { type DB, schema, generateId } from '@soker90/finper-db'
const { pensionPlans, pensions } = schema

type NewPlan = typeof pensionPlans.$inferInsert
type Plan = typeof pensionPlans.$inferSelect
type NewMovement = typeof pensions.$inferInsert
type Movement = typeof pensions.$inferSelect

const UNIT_EPSILON = 1e-6

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
    destinationValue: customDestinationValue
  }: {
    sourcePlanId: string
    destinationPlanId: string
    user: string
    date: number
    destinationValue?: number
  }): [Movement, Movement] => {
    return db.transaction((tx) => {
      const sourcePlan = tx.select({ id: pensionPlans.id })
        .from(pensionPlans)
        .where(and(eq(pensionPlans.id, sourcePlanId), eq(pensionPlans.user, user)))
        .get()
      const destinationPlan = tx.select({ id: pensionPlans.id })
        .from(pensionPlans)
        .where(and(eq(pensionPlans.id, destinationPlanId), eq(pensionPlans.user, user)))
        .get()

      if (!sourcePlan || !destinationPlan) {
        throw Boom.notFound(ERROR_MESSAGE.PENSION_PLAN.NOT_FOUND).output
      }

      const sourceMovements = tx.select()
        .from(pensions)
        .where(and(eq(pensions.planId, sourcePlanId), eq(pensions.user, user)))
        .orderBy(desc(pensions.date))
        .all()
      const destinationMovements = tx.select()
        .from(pensions)
        .where(and(eq(pensions.planId, destinationPlanId), eq(pensions.user, user)))
        .orderBy(desc(pensions.date))
        .all()

      const sourceLatest = sourceMovements[0]
      const destinationLatest = destinationMovements[0]
      const effectiveDestinationValue = customDestinationValue ?? destinationLatest?.value

      if (
        (sourceLatest && date < sourceLatest.date) ||
        (destinationLatest && date < destinationLatest.date)
      ) {
        throw Boom.badData(ERROR_MESSAGE.PENSION_PLAN.TRANSFER_DATE_BEFORE_LATEST_MOVEMENT).output
      }

      if (
        !sourceLatest ||
        !Number.isFinite(sourceLatest.value) ||
        sourceLatest.value <= 0 ||
        effectiveDestinationValue === undefined ||
        !Number.isFinite(effectiveDestinationValue) ||
        effectiveDestinationValue <= 0
      ) {
        throw Boom.badData(ERROR_MESSAGE.PENSION_PLAN.TRANSFER_REQUIRES_VALUATION).output
      }

      const sumUnits = (movements: Movement[], key: 'employeeUnits' | 'companyUnits') =>
        movements.reduce((total, movement) => total + movement[key], 0)

      const rawEmployeeUnits = sumUnits(sourceMovements, 'employeeUnits')
      const rawCompanyUnits = sumUnits(sourceMovements, 'companyUnits')
      const sourceEmployeeAmount = sumUnits(sourceMovements, 'employeeAmount')
      const sourceCompanyAmount = sumUnits(sourceMovements, 'companyAmount')
      const sourceEmployeeUnits = Math.abs(rawEmployeeUnits) <= UNIT_EPSILON ? 0 : rawEmployeeUnits
      const sourceCompanyUnits = Math.abs(rawCompanyUnits) <= UNIT_EPSILON ? 0 : rawCompanyUnits
      const sourceUnits = sourceEmployeeUnits + sourceCompanyUnits

      if (
        !Number.isFinite(sourceEmployeeUnits) ||
        !Number.isFinite(sourceCompanyUnits) ||
        !Number.isFinite(sourceUnits) ||
        sourceUnits <= UNIT_EPSILON ||
        sourceEmployeeUnits < 0 ||
        sourceCompanyUnits < 0
      ) {
        throw Boom.badData(ERROR_MESSAGE.PENSION_PLAN.TRANSFER_INVALID_ASSETS).output
      }

      // Transfer value, not units: the destination NAV can differ from the source NAV.
      const sourceValue = sourceUnits * sourceLatest.value
      const destinationUnits = sourceValue / effectiveDestinationValue
      if (!Number.isFinite(sourceValue) || sourceValue <= 0 || !Number.isFinite(destinationUnits) || destinationUnits <= 0) {
        throw Boom.badData(ERROR_MESSAGE.PENSION_PLAN.TRANSFER_INVALID_ASSETS).output
      }

      const employeeShare = sourceEmployeeUnits / sourceUnits

      const sourceMovement = tx.insert(pensions).values({
        id: generateId(),
        planId: sourcePlanId,
        date,
        employeeAmount: -sourceEmployeeAmount,
        employeeUnits: -sourceEmployeeUnits,
        companyAmount: -sourceCompanyAmount,
        companyUnits: -sourceCompanyUnits,
        value: sourceLatest.value,
        user
      }).returning().get()

      const destinationMovement = tx.insert(pensions).values({
        id: generateId(),
        planId: destinationPlanId,
        date,
        employeeAmount: sourceEmployeeAmount,
        employeeUnits: destinationUnits * employeeShare,
        companyAmount: sourceCompanyAmount,
        companyUnits: destinationUnits * (1 - employeeShare),
        value: effectiveDestinationValue,
        user
      }).returning().get()

      return [sourceMovement, destinationMovement]
    }, { behavior: 'immediate' })
  }
})
