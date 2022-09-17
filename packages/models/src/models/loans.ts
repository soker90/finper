import { Schema, model, ObjectId } from 'mongoose'
import InputLabel from '@soker90/finper-client/src/themes/overrides/InputLabel'
import type = Mocha.utils.type;

export interface ILoanSaving {
    cost: number,
    date: number,
    saving: number,
    accumulated: number,
    pending: number,
    finishDate: number
}

export interface ILoan {
    _id: ObjectId,
    date: number,
    name: string,
    interest: number,
    saving: ILoanSaving[],
    user: string,
}

const loanSavingSchema = new Schema<ILoanSaving>({
  cost: { type: Number, required: true },
  date: { type: Number, required: true },
  saving: { type: Number, required: true },
  accumulated: { type: Number, required: true },
  pending: { type: Number, required: true },
  finishDate: { type: Number, required: true }
})

const loanSchema = new Schema<ILoan>({
  date: { type: Number },
  name: { type: String, required: true },
  interest: { type: Number, required: true },
  saving: { type: [loanSavingSchema], required: true, default: [] },
  user: { type: String, required: true }
}, { versionKey: false })

export const LoanModel = model<ILoan>('Loan', loanSchema)
