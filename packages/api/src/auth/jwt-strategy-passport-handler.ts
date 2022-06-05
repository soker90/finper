import passport from 'passport'
import passportJwt from 'passport-jwt'

import config from '../config'

const {
  IUser,
  UserModel
} = require('@soker90/finper-models')

const JwtStrategy = passportJwt.Strategy
const ExtractJwt = passportJwt.ExtractJwt

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret
}, function (jwtToken, done) {
  UserModel.findOne({ username: jwtToken.username }, function (err: Error, user: typeof IUser) {
    if (err) { return done(err, false) }

    if (user) {
      return done(undefined, user, jwtToken)
    }

    return done(undefined, false)
  })
}))
