import { model, ObjectId, Schema } from 'mongoose'

export interface IPension {
    _id: ObjectId,
    date: number,
    employeeAmount: number,
    employeeUnits: number,
    companyAmount: number,
    companyUnits: number,
    value: number,
    user: string,
}

const pensionSchema = new Schema<IPension>({
  date: { type: Number, required: true },
  employeeAmount: { type: Number, required: true },
  employeeUnits: { type: Number, required: true },
  companyAmount: { type: Number, required: true },
  companyUnits: { type: Number, required: true },
  value: { type: Number, required: true },
  user: { type: String, required: true }
}, { versionKey: false })

export const PensionModel = model<IPension>('Pension', pensionSchema)
