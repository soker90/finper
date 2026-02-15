import { model, Schema, Types, HydratedDocument } from 'mongoose'

export interface IBudget {
  year: number
  month: number
  category: Types.ObjectId
  amount: number
  user: string
}

export type BudgetDocument = HydratedDocument<IBudget>

const budgetSchema = new Schema<IBudget>({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  amount: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
  user: { type: String, required: true }
}, { versionKey: false })

export const BudgetModel = model<IBudget>('Budget', budgetSchema)
