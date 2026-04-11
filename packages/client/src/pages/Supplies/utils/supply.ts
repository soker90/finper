import { Supply, SupplyType } from 'types'

export const SUPPLY_TYPE_LABELS: Record<SupplyType, string> = {
  electricity: 'Electricidad',
  water: 'Agua',
  gas: 'Gas',
  internet: 'Internet',
  other: 'Otro'
}

export const supplyDisplayName = (supply: Supply): string =>
  supply.type === 'other' ? supply.name ?? '' : SUPPLY_TYPE_LABELS[supply.type]
