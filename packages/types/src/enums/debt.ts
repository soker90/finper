export const DEBT = {
  FROM: 'from',
  TO: 'to',
} as const

export type DebtType = typeof DEBT[keyof typeof DEBT]
