import { Schema, model, HydratedDocument, Types } from 'mongoose'

export interface ILoanEvent {
  loan: Types.ObjectId
  date: number
  newRate: number
  newPayment: number
  user: string
}

export type LoanEventDocument = HydratedDocument<ILoanEvent>

const loanEventSchema = new Schema<ILoanEvent>({
  loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
  date: { type: Number, required: true },
  newRate: { type: Number, required: true },
  newPayment: { type: Number, required: true },
  user: { type: String, required: true }
}, { versionKey: false })

export const LoanEventModel = model<ILoanEvent>('LoanEvent', loanEventSchema)
