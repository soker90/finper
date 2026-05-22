import type { TransactionType } from '@soker90/finper-types'

export interface Transaction {
  _id?: string,
  date: number,
  category: {
    _id: string,
    name: string,
  },
  amount: number,
  type: TransactionType,
  account: {
    _id: string,
    name: string,
    bank: string,
  },
  note?: string,
  store?: {
    name: string,
  },
  tags?: string[],
}
