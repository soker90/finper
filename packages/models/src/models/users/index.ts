import { Schema, model, HydratedDocument } from 'mongoose'
import encryptPasswordPreSave from './hooks/encrypt-password-pre-save'

export interface IUser {
  username: string
  password: string
}

export type UserDocument = HydratedDocument<IUser>

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  password: { type: String, required: true }
}, { versionKey: false })

userSchema.pre('save', encryptPasswordPreSave)

export const UserModel = model<IUser>('User', userSchema)
