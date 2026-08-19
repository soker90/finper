import Boom from '@hapi/boom'

import { ERROR_MESSAGE } from '../../i18n'
import { serializePensionPlan, serializePensionMovement, type PensionAggregate, type SerializedPensionMovement } from './pension-plans.serializer'

type IPensionPlansRepository = ReturnType<typeof import('./pension-plans.repository').createPensionPlansRepository>

export interface PensionAggregateSummary extends PensionAggregate {
  transactions: SerializedPensionMovement[]
}

interface MovementLike {
  employeeAmount: number
  employeeUnits: number
  companyAmount: number
  companyUnits: number
  value: number
}

/** Suma aportaciones/unidades y calcula el total con el valor de la unidad más
 * reciente (movements[0]), asumiendo que `movements` viene ordenado por fecha
 * descendente. */
const computeAggregate = (movements: MovementLike[]): PensionAggregate => {
  let amount = 0
  let units = 0
  let employeeAmount = 0
  let companyAmount = 0

  for (const movement of movements) {
    employeeAmount += movement.employeeAmount
    companyAmount += movement.companyAmount
    amount += movement.employeeAmount + movement.companyAmount
    units += movement.employeeUnits + movement.companyUnits
  }

  const total = (movements[0]?.value ?? 0) * units

  return { amount, units, employeeAmount, companyAmount, total }
}

export class PensionPlansService {
  constructor (private repository: IPensionPlansRepository) {}

  public getPlans (user: string) {
    return this.repository.findPlansByUser(user).map((plan) => {
      const movements = this.repository.findMovements(plan.id, user)
      return serializePensionPlan(plan, computeAggregate(movements))
    })
  }

  public getPlanById (id: string, user: string) {
    const plan = this.repository.findPlanById(id, user)
    if (!plan) throw Boom.notFound(ERROR_MESSAGE.PENSION_PLAN.NOT_FOUND).output

    const movements = this.repository.findMovements(id, user)
    return serializePensionPlan(plan, computeAggregate(movements))
  }

  public createPlan ({ user, data }: { user: string, data: { name: string } }) {
    const plan = this.repository.createPlan({ ...data, user })
    return serializePensionPlan(plan, computeAggregate([]))
  }

  public editPlan ({ id, user, value }: { id: string, user: string, value: { name?: string } }) {
    const plan = this.repository.updatePlan(id, user, value)
    if (!plan) throw Boom.notFound(ERROR_MESSAGE.PENSION_PLAN.NOT_FOUND).output

    const movements = this.repository.findMovements(id, user)
    return serializePensionPlan(plan, computeAggregate(movements))
  }

  public deletePlan (id: string, user: string): boolean {
    return this.repository.deletePlan(id, user)
  }

  public getMovements (planId: string, user: string) {
    return this.repository.findMovements(planId, user).map(serializePensionMovement)
  }

  public addMovement ({ planId, user, data }: { planId: string, user: string, data: any }) {
    const movement = this.repository.createMovement({ ...data, planId, user })
    return serializePensionMovement(movement)
  }

  public editMovement ({ id, planId, user, value }: { id: string, planId: string, user: string, value: any }) {
    const existing = this.repository.findMovementById(id, user)
    if (!existing || existing.planId !== planId) {
      throw Boom.notFound(ERROR_MESSAGE.PENSION_PLAN.MOVEMENT_NOT_FOUND).output
    }

    const updated = this.repository.updateMovement(id, user, value)
    return serializePensionMovement(updated!)
  }

  public deleteMovement ({ id, planId, user }: { id: string, planId: string, user: string }): boolean {
    const existing = this.repository.findMovementById(id, user)
    if (!existing || existing.planId !== planId) {
      throw Boom.notFound(ERROR_MESSAGE.PENSION_PLAN.MOVEMENT_NOT_FOUND).output
    }

    return this.repository.deleteMovement(id, user)
  }

  /** Resumen agregado de TODOS los planes de un usuario, usado por el dashboard. */
  public getAggregateSummary (user: string): PensionAggregateSummary {
    const movements = this.repository.findAllMovementsByUser(user)
    return {
      ...computeAggregate(movements),
      transactions: movements.map(serializePensionMovement)
    }
  }
}
