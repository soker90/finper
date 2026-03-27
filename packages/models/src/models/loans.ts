import { Schema, model, HydratedDocument, Types } from 'mongoose'

export interface ILoan {
  name: string
  initialAmount: number
  pendingAmount: number
  interestRate: number
  startDate: number
  monthlyPayment: number
  initialEstimatedCost: number
  pendingExtraInterest?: number
  account: Types.ObjectId
  category: Types.ObjectId
  user: string
}

export type LoanDocument = HydratedDocument<ILoan>

const loanSchema = new Schema<ILoan>({
  name: { type: String, required: true },
  initialAmount: { type: Number, required: true },
  pendingAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  startDate: { type: Number, required: true },
  monthlyPayment: { type: Number, required: true },
  initialEstimatedCost: { type: Number, required: true },
  pendingExtraInterest: { type: Number, default: 0 },
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  user: { type: String, required: true }
}, { versionKey: false })

export const LoanModel = model<ILoan>('Loan', loanSchema)
