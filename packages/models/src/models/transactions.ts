import { Schema, model, ObjectId } from 'mongoose'

export enum TransactionType {
    Expense = 'expense',
    Income = 'income',
    NotComputable = 'not_computable',
}

export interface ITransaction {
    _id: ObjectId,
    date: number,
    category: string,
    amount: number,
    type: TransactionType,
    account: string,
    note: string,
    store?: string,
}

const transactionSchema = new Schema<ITransaction>({
  date: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  account: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
  note: { type: String },
  store: { type: Schema.Types.ObjectId, ref: 'Store' }
}, { versionKey: false })

export const TransactionModel = model<ITransaction>('Transaction', transactionSchema)
