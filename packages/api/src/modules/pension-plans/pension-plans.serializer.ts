import { schema } from '@soker90/finper-db'

type Plan = typeof schema.pensionPlans.$inferSelect
type Movement = typeof schema.pensions.$inferSelect

export interface PensionAggregate {
  amount: number
  units: number
  employeeAmount: number
  companyAmount: number
  total: number
}

export const serializePensionPlan = (plan: Plan, aggregate: PensionAggregate) => {
  return {
    _id: plan.id,
    id: plan.id,
    name: plan.name,
    user: plan.user,
    amount: aggregate.amount,
    units: aggregate.units,
    employeeAmount: aggregate.employeeAmount,
    companyAmount: aggregate.companyAmount,
    total: aggregate.total
  }
}

export type SerializedPensionPlan = ReturnType<typeof serializePensionPlan>

export const serializePensionMovement = (movement: Movement) => {
  return {
    _id: movement.id,
    id: movement.id,
    planId: movement.planId,
    date: movement.date,
    employeeAmount: movement.employeeAmount,
    employeeUnits: movement.employeeUnits,
    companyAmount: movement.companyAmount,
    companyUnits: movement.companyUnits,
    value: movement.value,
    user: movement.user
  }
}

export type SerializedPensionMovement = ReturnType<typeof serializePensionMovement>
