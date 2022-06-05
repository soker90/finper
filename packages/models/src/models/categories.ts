import { Schema, model, Document } from 'mongoose'
import { TransactionType } from './transactions'

export interface ICategory extends Document {
    name: string,
    type: TransactionType,
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  type: { type: String, required: true }
}, { versionKey: false })

export const CategoryModel = model<ICategory>('Category', categorySchema)
