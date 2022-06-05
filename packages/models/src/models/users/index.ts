import { Schema, model, Document } from 'mongoose'
import encryptPasswordPreSave from './hooks/encrypt-password-pre-save'

export interface IUser extends Document {
    username: string
    password: string
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  password: { type: String, required: true }
}, { versionKey: false })

userSchema.pre<IUser>('save', encryptPasswordPreSave)

export const UserModel = model<IUser>('User', userSchema)
