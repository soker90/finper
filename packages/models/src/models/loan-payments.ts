import { Schema, model, HydratedDocument, Types } from 'mongoose'

export const LOAN_PAYMENT = {
  ORDINARY: 'ordinary',
  EXTRAORDINARY: 'extraordinary',
} as const

export type LoanPaymentType = typeof LOAN_PAYMENT[keyof typeof LOAN_PAYMENT]

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
  interest: { type: Number, default: 0 },
  principal: { type: Number, required: true },
  accumulatedPrincipal: { type: Number, required: true },
  pendingCapital: { type: Number, required: true },
  type: { type: String, enum: Object.values(LOAN_PAYMENT), default: LOAN_PAYMENT.ORDINARY },
  user: { type: String, required: true }
}, { versionKey: false })

loanPaymentSchema.index({ loan: 1, user: 1, date: 1 })

export const LoanPaymentModel = model<ILoanPayment>('LoanPayment', loanPaymentSchema)
