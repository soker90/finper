import { Types, HydratedDocument } from 'mongoose'
import type { TransactionType, LoanPaymentType } from '@soker90/finper-types'

// Constantes y tipos del antiguo core Mongoose que aún consume código vivo
// (getTransactionAmount, stats.types, calcLoanProjection). Se mantienen aquí,
// desacoplados de los modelos Mongoose ya eliminados.

export const TRANSACTION = {
  Expense: 'expense',
  Income: 'income',
  NotComputable: 'not_computable',
} as const

export interface ITransaction {
  date: number
  category: Types.ObjectId
  amount: number
  type: TransactionType
  account: Types.ObjectId
  note?: string
  store?: Types.ObjectId
  subscriptionId?: Types.ObjectId
  tags?: string[]
  user: string
}

export type TransactionDocument = HydratedDocument<ITransaction>

export const LOAN_PAYMENT = {
  ORDINARY: 'ordinary',
  EXTRAORDINARY: 'extraordinary',
} as const

export interface ILoanPayment {
  loan: Types.ObjectId
  date: number
  amount: number
  interest: number
  principal: number
  accumulatedPrincipal: number
  pendingCapital: number
  type: LoanPaymentType
  user: string
}
