import { model, ObjectId, Schema } from 'mongoose'
import { TransactionType } from './transactions'

export interface ICategory {
    _id: ObjectId,
    name: string,
    type: TransactionType,
    parent?: ObjectId,
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable]
  },
  parent: { type: Schema.Types.ObjectId, ref: 'Category' }
}, { versionKey: false })

export const CategoryModel = model<ICategory>('Category', categorySchema)
