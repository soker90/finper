import { Schema, model, ObjectId } from 'mongoose'

export enum DebtType {
  FROM = 'from',
  TO = 'to',
}

export interface IDebt {
  _id: ObjectId,
  from: string
  date: number,
  amount: number,
  paymentDate: number,
  concept: string,
  type: DebtType,
  user: string,
}

const debtSchema = new Schema<IDebt>({
  from: { type: String, required: true },
  date: { type: Number },
  amount: { type: Number, required: true },
  paymentDate: { type: Number },
  concept: { type: String },
  type: { type: String, required: true, enum: [DebtType.FROM, DebtType.TO] },
  user: { type: String, required: true }
}, { versionKey: false })

export const DebtModel = model<IDebt>('Debt', debtSchema)
