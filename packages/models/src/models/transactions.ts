import { Schema, model, Types } from 'mongoose'

export enum TransactionType {
  Expense = 'expense',
  Income = 'income',
  NotComputable = 'not_computable',
}

export interface ITransaction {
  date: number
  category: Types.ObjectId
  amount: number
  type: TransactionType
  account: Types.ObjectId
  note?: string
  store?: Types.ObjectId
  user: string
}

const transactionSchema = new Schema<ITransaction>({
  date: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
  amount: { type: Number, required: true },
  type: {
    type: String,
    required: true,
    enum: [TransactionType.Expense, TransactionType.Income, TransactionType.NotComputable]
  },
  account: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
  note: { type: String },
  store: { type: Schema.Types.ObjectId, ref: 'Store' },
  user: { type: String, required: true }
}, { versionKey: false })

export const TransactionModel = model<ITransaction>('Transaction', transactionSchema)
