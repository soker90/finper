import { model, Schema, Types, HydratedDocument } from 'mongoose'
import { TransactionType, TRANSACTION } from './transactions'

export interface ICategory {
  name: string
  type: TransactionType
  parent?: Types.ObjectId
  user: string
  isSystem?: boolean
}

export type CategoryDocument = HydratedDocument<ICategory>

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable]
  },
  parent: { type: Schema.Types.ObjectId, ref: 'Category' },
  user: { type: String, required: true },
  isSystem: { type: Boolean, default: false }
}, { versionKey: false })

export const CategoryModel = model<ICategory>('Category', categorySchema)
