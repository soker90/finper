import { Schema, model, Document } from 'mongoose'
import encryptPasswordPreSave from './hooks/encrypt-password-pre-save'

export interface IAccount extends Document{
    username: string
    password: string
    create: any
    countDocuments: any
    findOne: any
    find: any
    findOneAndUpdate: any
}

const accountSchema = new Schema<IAccount>({
  username: { type: String, required: true },
  password: { type: String, required: true }
}, { versionKey: false })

accountSchema.pre<IAccount>('save', encryptPasswordPreSave)

export default model('Account', accountSchema, 'account')
