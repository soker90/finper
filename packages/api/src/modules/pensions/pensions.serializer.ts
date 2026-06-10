import { schema } from '@soker90/finper-db'

type Pension = typeof schema.pensions.$inferSelect

export const serializePension = (pension: Pension) => {
  return {
    _id: pension.id,
    date: pension.date,
    employeeAmount: pension.employeeAmount,
    employeeUnits: pension.employeeUnits,
    companyAmount: pension.companyAmount,
    companyUnits: pension.companyUnits,
    value: pension.value,
    user: pension.user
  }
}
