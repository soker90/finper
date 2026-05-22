export const SUPPLY_TYPE = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  GAS: 'gas',
  OTHER: 'other',
} as const

export type SupplyType = typeof SUPPLY_TYPE[keyof typeof SUPPLY_TYPE]
