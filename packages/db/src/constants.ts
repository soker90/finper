// Constantes de dominio compartidas entre módulos de la API.
// Viven aquí (finper-db, sin mongoose) en lugar de en finper-models.

export const TRANSACTION = {
  Expense: 'expense',
  Income: 'income',
  NotComputable: 'not_computable'
} as const

export const LOAN_PAYMENT = {
  ORDINARY: 'ordinary',
  EXTRAORDINARY: 'extraordinary'
} as const

export const SUPPLY_TYPE = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  GAS: 'gas',
  OTHER: 'other'
} as const
