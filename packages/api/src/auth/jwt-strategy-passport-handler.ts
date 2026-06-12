import passport from 'passport'
import passportJwt from 'passport-jwt'

import config from '../config'

import { usersRepository } from '../modules/users/users.repository'

const JwtStrategy = passportJwt.Strategy
const ExtractJwt = passportJwt.ExtractJwt

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret
}, function (jwtToken, done) {
  try {
    const user = usersRepository.findByUsername(jwtToken.username)
    if (user) {
      return done(undefined, user, jwtToken)
    }
    return done(undefined, false)
  } catch (err) {
    return done(err, false)
  }
}))
