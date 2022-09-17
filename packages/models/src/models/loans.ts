import { Schema, model, ObjectId } from 'mongoose'

export enum LoanType {
    quota,
    amortization,
}

export interface ILoan {
    _id: ObjectId,
    date: number,
    amount: number,
    interests: number,
    amortization: number,
    accumulated: number,
    pending: number,
    type: LoanType,
    user: string,
}

const loanSchema = new Schema<ILoan>({
  date: { type: Number },
  amount: { type: Number, required: true },
  interests: { type: Number, required: true },
  amortization: { type: Number, required: true },
  accumulated: { type: Number, required: true },
  pending: { type: Number, required: true },
  type: { type: Number, required: true, enum: [LoanType.quota, LoanType.amortization] },
  user: { type: String, required: true }
}, { versionKey: false })

export const LoanModel = model<ILoan>('Loan', loanSchema)
