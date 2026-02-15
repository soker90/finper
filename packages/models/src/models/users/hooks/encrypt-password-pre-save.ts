import { genSalt, hash } from 'bcrypt'
import { UserDocument } from '../index'

export default async function encryptPasswordPreSave (this: UserDocument) {
  const salt = await genSalt(10)
  this.password = await hash(this.password, salt)
}
