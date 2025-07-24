import passport from 'passport'
import passportJwt from 'passport-jwt'

import config from '../config'

const {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IUser,
  UserModel
} = require('@soker90/finper-models')

const JwtStrategy = passportJwt.Strategy
const ExtractJwt = passportJwt.ExtractJwt

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret
}, function (jwtToken, done) {
  UserModel.findOne({ username: jwtToken.username }).then((user: typeof IUser) => {
    if (user) {
      return done(undefined, user, jwtToken)
    }
    return done(undefined, false)
  }).catch((err: Error) => {
    if (err) {
      return done(err, false)
    }
    return done(undefined, false)
  })
}))
