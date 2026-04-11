import { Schema, model, HydratedDocument, Types } from 'mongoose'

export const SUPPLY_TYPE = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  GAS: 'gas',
  INTERNET: 'internet',
  OTHER: 'other'
} as const

export type SupplyType = typeof SUPPLY_TYPE[keyof typeof SUPPLY_TYPE]

export interface ISupply {
  name?: string
  type: SupplyType
  propertyId: Types.ObjectId
  user: string
}

export type SupplyDocument = HydratedDocument<ISupply>

const supplySchema = new Schema<ISupply>({
  name: { type: String, required: false },
  type: { type: String, enum: Object.values(SUPPLY_TYPE), required: true },
  propertyId: { type: Schema.Types.ObjectId, required: true, ref: 'Property' },
  user: { type: String, required: true }
}, { versionKey: false })

export const SupplyModel = model<ISupply>('Supply', supplySchema)
