import { Schema, model, Document } from 'mongoose'

export interface IAccount extends Document {
    name: string
    bank: string,
    balance: number,
}

const accountSchema = new Schema<IAccount>({
  name: { type: String, required: true },
  bank: { type: String, required: true },
  balance: { type: Number, default: 0 }
}, { versionKey: false })

export const AccountModel = model<IAccount>('Account', accountSchema)
