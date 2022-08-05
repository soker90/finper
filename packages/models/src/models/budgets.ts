import { model, ObjectId, Schema } from 'mongoose'

export interface CategoryBudget {
    _id: ObjectId,
    amount: number,
    category: ObjectId,
}
export interface IBudget {
    _id: ObjectId,
    year: number,
    month: number,
    budget: CategoryBudget[],
    user: string,
}

const categoryBudgetSchema = new Schema<CategoryBudget>({
  amount: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' }
})

const budgetSchema = new Schema<IBudget>({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  budget: { type: [categoryBudgetSchema], required: true },
  user: { type: String, required: true }
}, { versionKey: false })

export const BudgetModel = model<IBudget>('Budget', budgetSchema)
