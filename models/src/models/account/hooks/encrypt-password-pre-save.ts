import { genSalt, hash } from 'bcrypt'

export default function encryptPasswordPreSave (next) {
  genSalt(10, (err, salt) => {
    /* istanbul ignore next */
    if (err) return next(err)
    hash(this.password, salt, (e, hash) => {
      /* istanbul ignore next */
      if (e) return next(e)
      this.password = hash
      next()
    })
  })
}
