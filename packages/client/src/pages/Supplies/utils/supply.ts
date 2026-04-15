import { Supply, SupplyType } from 'types'

export type { SupplyType }

export const SUPPLY_TYPE_LABELS: Record<SupplyType, string> = {
  electricity: 'Electricidad',
  water: 'Agua',
  gas: 'Gas',
  internet: 'Internet',
  other: 'Otro'
}

export const SUPPLY_TYPE_COLORS: Record<string, 'warning' | 'info' | 'error' | 'primary' | 'default'> = {
  electricity: 'warning',
  water: 'info',
  gas: 'error',
  internet: 'primary',
  other: 'default'
}

export const SUPPLY_TYPE_UNITS: Record<SupplyType, string> = {
  electricity: 'kWh',
  water: 'm³',
  gas: 'kWh',
  internet: '',
  other: ''
}

export const supplyDisplayName = (supply: Supply): string =>
  supply.type === 'other' ? supply.name ?? '' : SUPPLY_TYPE_LABELS[supply.type]
