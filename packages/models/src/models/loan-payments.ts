import { Schema, model, HydratedDocument, Types } from 'mongoose'

export enum LoanPaymentType {
  ORDINARY = 'ordinary',
  EXTRAORDINARY = 'extraordinary',
}

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

export type LoanPaymentDocument = HydratedDocument<ILoanPayment>

const loanPaymentSchema = new Schema<ILoanPayment>({
  loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
  date: { type: Number, required: true },
  amount: { type: Number, required: true },
  interest: { type: Number, required: true, default: 0 },
  principal: { type: Number, required: true },
  accumulatedPrincipal: { type: Number, required: true },
  pendingCapital: { type: Number, required: true },
  type: { type: String, required: true, enum: Object.values(LoanPaymentType), default: LoanPaymentType.ORDINARY },
  user: { type: String, required: true }
}, { versionKey: false })

export const LoanPaymentModel = model<ILoanPayment>('LoanPayment', loanPaymentSchema)
