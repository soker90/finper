import { TransactionType } from '@soker90/finper-shared'

export { TransactionType }

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
}

export interface TransactionInput {
  _id?: string,
  date: number,
  category: string,
  amount: number,
  type: TransactionType,
  account: string,
  note?: string,
  store?: string,
}
