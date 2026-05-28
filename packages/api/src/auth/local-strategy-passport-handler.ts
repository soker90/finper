import bcrypt from 'bcrypt'
import passport from 'passport'
import passportLocal from 'passport-local'

import { usersRepository } from '../modules/users/users.repository'

const LocalStrategy = passportLocal.Strategy

passport.use(new LocalStrategy({ usernameField: 'username' }, function (user, password, done) {
  const lowercaseUser = user.toLowerCase()

  const query = { username: lowercaseUser }

  try {
    const userDocument = usersRepository.findByUsername(lowercaseUser)
    if (!userDocument) {
      return done(null, false)
    }

    const isSamePassword = bcrypt.compareSync(password, userDocument.password)

    if (!isSamePassword) {
      return done(null, false)
    }

    return done(null, userDocument)
  } catch (err) {
    return done(err)
  }
}
))
