import { DebtType } from '@soker90/finper-shared'

export { DebtType }

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
