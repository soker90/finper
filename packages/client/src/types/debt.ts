export const DEBT = {
  FROM: 'from',
  TO: 'to',
} as const

export type DebtType = typeof DEBT[keyof typeof DEBT]

export interface Debt {
  _id?: string;
  from: string
  date: number,
  amount: number,
  paymentDate: number,
  concept: string,
  type: DebtType,
  // user: string,
}
