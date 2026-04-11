import { Schema, model, HydratedDocument, Types } from 'mongoose'

export interface ISupplyReading {
  supplyId: Types.ObjectId
  startDate: number
  endDate: number
  consumption?: number
  consumptionPeak?: number
  consumptionFlat?: number
  consumptionOffPeak?: number
  user: string
}

export type SupplyReadingDocument = HydratedDocument<ISupplyReading>

const supplyReadingSchema = new Schema<ISupplyReading>({
  supplyId: { type: Schema.Types.ObjectId, required: true, ref: 'Supply' },
  startDate: { type: Number, required: true },
  endDate: { type: Number, required: true, validate: { validator: function (this: any, value: number) { return value >= this.startDate }, message: 'endDate must be greater than or equal to startDate' } },
  consumption: { type: Number },
  consumptionPeak: { type: Number },
  consumptionFlat: { type: Number },
  consumptionOffPeak: { type: Number },
  user: { type: String, required: true }
}, { versionKey: false })

export const SupplyReadingModel = model<ISupplyReading>('SupplyReading', supplyReadingSchema)
