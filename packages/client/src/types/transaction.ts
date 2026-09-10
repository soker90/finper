import type { TransactionType } from '@soker90/finper-types'

export interface TransactionSplit {
  _id: string,
  category: {
    _id: string,
    name: string,
  },
  amount: number,
  tags?: string[],
}

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
  creditCard?: {
    id: string,
    name: string,
  } | null,
  tags?: string[],
  splits?: TransactionSplit[],
}

// Filters accepted by GET /transactions (see TransactionFilters in
// packages/api/src/modules/transactions/transactions.repository.ts). The
// values are always the _id of the selected entity (or '' when there is no
// active filter), never the full object.
export interface TransactionFilters {
  account?: string,
  category?: string,
  type?: string,
  store?: string,
}
