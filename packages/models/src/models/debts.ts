import { Schema, model, HydratedDocument } from 'mongoose'
import { DebtType } from '@soker90/finper-shared'

export { DebtType }

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
  type: { type: String, required: true, enum: [DebtType.FROM, DebtType.TO] },
  user: { type: String, required: true }
}, { versionKey: false })

export const DebtModel = model<IDebt>('Debt', debtSchema)
