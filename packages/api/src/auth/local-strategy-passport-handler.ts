import bcrypt from 'bcrypt'
import passport from 'passport'
import passportLocal from 'passport-local'

const { UserModel } = require('@soker90/finper-models')

const LocalStrategy = passportLocal.Strategy

passport.use(new LocalStrategy({ usernameField: 'username' }, function (user, password, done) {
  const lowercaseUser = user.toLowerCase()

  const query = { username: lowercaseUser }

  UserModel.findOne(query).then((userDocument: Record<string, string>) => {
    if (!userDocument) {
      return done(null, false)
    }

    const isSamePassword = bcrypt.compareSync(password, userDocument.password)

    if (!isSamePassword) {
      return done(null, false)
    }

    return done(null, userDocument)
  }).catch((err: Error) => {
    if (err) {
      return done(err)
    }
    return done(null)
  })
}
))
