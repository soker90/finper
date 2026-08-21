import { PensionPlan } from 'types'

export const PENSION_PLAN_COLORS = [
  { value: '#4CAF50', label: 'Verde' },
  { value: '#2196F3', label: 'Azul' },
  { value: '#9C27B0', label: 'Morado' },
  { value: '#FF9800', label: 'Naranja' },
  { value: '#F44336', label: 'Rojo' },
  { value: '#00BCD4', label: 'Cian' },
  { value: '#795548', label: 'Marrón' },
  { value: '#607D8B', label: 'Gris azulado' },
  { value: '#E91E63', label: 'Rosa' },
  { value: '#FFC107', label: 'Amarillo' }
]

export const STATS: { title: string, value: keyof Omit<PensionPlan, '_id' | 'id' | 'name' | 'color' | 'user'>, currency?: boolean }[] = [
  { title: 'Total', value: 'total' },
  { title: 'Unidades', value: 'units', currency: false },
  { title: 'Aportado', value: 'amount' },
  { title: 'Empleado', value: 'employeeAmount' },
  { title: 'Empresa', value: 'companyAmount' }
]
