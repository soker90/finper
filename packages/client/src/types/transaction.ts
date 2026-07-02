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

// Filtros aceptados por GET /transactions (ver TransactionFilters en
// packages/api/src/modules/transactions/transactions.repository.ts). Los
// valores son siempre el _id de la entidad seleccionada (o '' si no hay
// filtro activo), nunca el objeto completo.
export interface TransactionFilters {
  account?: string,
  category?: string,
  type?: string,
  store?: string,
}
