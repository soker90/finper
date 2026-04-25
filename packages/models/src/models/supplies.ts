import { Schema, model, HydratedDocument, Types } from 'mongoose'

export const SUPPLY_TYPE = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  GAS: 'gas',
  OTHER: 'other'
} as const

export type SupplyType = typeof SUPPLY_TYPE[keyof typeof SUPPLY_TYPE]

export interface ISupply {
  name?: string
  type: SupplyType
  propertyId: Types.ObjectId
  user: string
  contractedPowerPeak?: number
  contractedPowerOffPeak?: number
  currentPricePowerPeak?: number
  currentPricePowerOffPeak?: number
  currentPriceEnergyPeak?: number
  currentPriceEnergyFlat?: number
  currentPriceEnergyOffPeak?: number
}

export type SupplyDocument = HydratedDocument<ISupply>

const supplySchema = new Schema<ISupply>({
  name: { type: String, required: false },
  type: { type: String, enum: Object.values(SUPPLY_TYPE), required: true },
  propertyId: { type: Schema.Types.ObjectId, required: true, ref: 'Property' },
  user: { type: String, required: true },
  contractedPowerPeak: { type: Number, required: false },
  contractedPowerOffPeak: { type: Number, required: false },
  currentPricePowerPeak: { type: Number, required: false },
  currentPricePowerOffPeak: { type: Number, required: false },
  currentPriceEnergyPeak: { type: Number, required: false },
  currentPriceEnergyFlat: { type: Number, required: false },
  currentPriceEnergyOffPeak: { type: Number, required: false }
}, { versionKey: false })

export const SupplyModel = model<ISupply>('Supply', supplySchema)
