import { model, Schema, Types, HydratedDocument } from 'mongoose'
import { TransactionType } from './transactions'

export interface ICategory {
  name: string
  type: TransactionType
  parent?: Types.ObjectId
  user: string
}

export type CategoryDocument = HydratedDocument<ICategory>

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable]
  },
  parent: { type: Schema.Types.ObjectId, ref: 'Category' },
  user: { type: String, required: true }
}, { versionKey: false })

export const CategoryModel = model<ICategory>('Category', categorySchema)
