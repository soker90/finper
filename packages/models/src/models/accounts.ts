import { Schema, model, Document } from 'mongoose'

export interface IAccount extends Document {
    name: string
    bank: string,
    balance: number,
    isActive: boolean,
    user: string,
}

const accountSchema = new Schema<IAccount>({
  name: { type: String, required: true },
  bank: { type: String, required: true },
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  user: { type: String, required: true }
}, { versionKey: false })

export const AccountModel = model<IAccount>('Account', accountSchema)
