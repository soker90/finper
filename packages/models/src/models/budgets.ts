import { model, ObjectId, Schema } from 'mongoose'

export interface IBudget {
    _id: ObjectId,
    year: number,
    month: number,
    category: ObjectId,
    amount: number,
    user: string,
}

const budgetSchema = new Schema<IBudget>({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  amount: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
  user: { type: String, required: true }
}, { versionKey: false })

export const BudgetModel = model<IBudget>('Budget', budgetSchema)
