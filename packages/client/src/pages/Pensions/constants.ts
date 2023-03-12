import { Pension } from 'types'

export const STATS: { title: string, value: keyof Omit<Pension, 'transactions'>, currency?: boolean }[] = [
  { title: 'Total', value: 'total' },
  { title: 'Unidades', value: 'units', currency: false },
  { title: 'Aportado', value: 'amount' },
  { title: 'Empleado', value: 'employeeAmount' },
  { title: 'Empresa', value: 'companyAmount' }
]
