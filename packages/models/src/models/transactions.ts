import { Schema, model, Types, HydratedDocument } from 'mongoose'

export const TRANSACTION = {
  Expense: 'expense',
  Income: 'income',
  NotComputable: 'not_computable',
} as const

export type TransactionType = typeof TRANSACTION[keyof typeof TRANSACTION]

export type TransactionDocument = HydratedDocument<ITransaction>

export interface ITransaction {
  date: number
  category: Types.ObjectId
  amount: number
  type: TransactionType
  account: Types.ObjectId
  note?: string
  store?: Types.ObjectId
  subscriptionId?: Types.ObjectId
  user: string
}

const transactionSchema = new Schema<ITransaction>({
  date: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
  amount: { type: Number, required: true },
  type: {
    type: String,
    required: true,
    enum: [TRANSACTION.Expense, TRANSACTION.Income, TRANSACTION.NotComputable]
  },
  account: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
  note: { type: String },
  store: { type: Schema.Types.ObjectId, ref: 'Store' },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  user: { type: String, required: true }
}, { versionKey: false })

export const TransactionModel = model<ITransaction>('Transaction', transactionSchema)
