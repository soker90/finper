import { Schema, model, HydratedDocument } from 'mongoose'

export interface IProperty {
  name: string
  user: string
}

export type PropertyDocument = HydratedDocument<IProperty>

const propertySchema = new Schema<IProperty>({
  name: { type: String, required: true },
  user: { type: String, required: true }
}, { versionKey: false })

export const PropertyModel = model<IProperty>('Property', propertySchema)
