import { Schema, model, ObjectId } from 'mongoose'
import { TransactionType } from './transactions'

export interface ICategory {
    _id: ObjectId,
    name: string,
    type: TransactionType,
    root?: boolean,
    parent?: ObjectId,
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  root: { type: Boolean },
  parent: { type: Schema.Types.ObjectId, ref: 'Category' }
}, { versionKey: false })

export const CategoryModel = model<ICategory>('Category', categorySchema)
