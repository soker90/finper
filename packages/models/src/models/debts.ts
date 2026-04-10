import { Schema, model, HydratedDocument } from 'mongoose'

export const DEBT = {
  FROM: 'from',
  TO: 'to',
} as const

export type DebtType = typeof DEBT[keyof typeof DEBT]

export interface IDebt {
  from: string
  date: number
  amount: number
  paymentDate: number
  concept: string
  type: DebtType
  user: string
}

export type DebtDocument = HydratedDocument<IDebt>

const debtSchema = new Schema<IDebt>({
  from: { type: String, required: true },
  date: { type: Number },
  amount: { type: Number, required: true },
  paymentDate: { type: Number },
  concept: { type: String },
  type: { type: String, required: true, enum: [DEBT.FROM, DEBT.TO] },
  user: { type: String, required: true }
}, { versionKey: false })

export const DebtModel = model<IDebt>('Debt', debtSchema)
