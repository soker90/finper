import { Account } from './account'
import { Category } from './category'
import { Store } from './store'

export type CreditCardMovementStatus = 'pending' | 'paid'

export interface CreditCard {
  _id: string
  id: string
  name: string
  accountId: string
  account?: Account | null
  limit?: number | null
  currentDebt?: number
  user: string
}

export interface CreditCardMovement {
  _id: string
  id: string
  creditCardId: string
  date: number
  amount: number
  type: 'expense' | 'income'
  categoryId: string
  category?: Category | null
  storeId?: string | null
  store?: Store | null
  note?: string | null
  status: CreditCardMovementStatus
  paidAt?: number | null
  transactionId?: string | null
  user: string
}
