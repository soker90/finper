import { genSalt, hash } from 'bcrypt'
import { IUser } from '../index'

export default function encryptPasswordPreSave (this: IUser, next: (arg0?: Error) => void) {
  genSalt(10, (err: Error | undefined, salt: string) => {
    /* istanbul ignore next */
    if (err) { return next(err) }
    hash(this.password, salt, (e: Error | undefined, hash: string) => {
      /* istanbul ignore next */
      if (e) { return next(e) }
      this.password = hash
      next()
    })
  })
}
