import { Schema, model, HydratedDocument } from 'mongoose'

export interface IAccount {
  name: string
  bank: string
  balance: number
  isActive: boolean
  user: string
}

export type AccountDocument = HydratedDocument<IAccount>

const accountSchema = new Schema<IAccount>({
  name: { type: String, required: true },
  bank: { type: String, required: true },
  balance: { type: Number, default: 0, set: (num: number) => Math.round(num * 100) / 100 },
  isActive: { type: Boolean, default: true },
  user: { type: String, required: true }
}, { versionKey: false })

export const AccountModel = model<IAccount>('Account', accountSchema)
