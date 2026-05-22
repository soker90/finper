import type { DebtType } from '@soker90/finper-types'

export interface Debt {
  _id?: string;
  from: string
  date: number,
  amount: number,
  concept: string,
  type: DebtType,
}
