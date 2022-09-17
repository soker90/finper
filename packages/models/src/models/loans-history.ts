import { Schema, model, ObjectId } from 'mongoose'

export enum LoanHistoryType {
    quota,
    amortization,
}

export interface ILoanHistory {
    _id: ObjectId,
    date: number,
    amount: number,
    interests: number,
    amortization: number,
    accumulated: number,
    pending: number,
    type: LoanHistoryType,
    user: string,
}

const loanHistorySchema = new Schema<ILoanHistory>({
  date: { type: Number },
  amount: { type: Number, required: true },
  interests: { type: Number, required: true },
  amortization: { type: Number, required: true },
  accumulated: { type: Number, required: true },
  pending: { type: Number, required: true },
  type: { type: Number, required: true, enum: [LoanHistoryType.quota, LoanHistoryType.amortization] },
  user: { type: String, required: true }
}, { versionKey: false })

export const LoanHistoryModel = model<ILoanHistory>('LoanHistory', loanHistorySchema)
