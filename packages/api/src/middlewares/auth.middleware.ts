import passport from 'passport'
import Boom from '@hapi/boom'
import { NextFunction, Request, Response } from 'express'
import { IUser } from '@soker90/finper-models'

import signToken from '../helpers/sign-token'
import '../auth/jwt-strategy-passport-handler'

/**
 * Returns the token in the response
 * @param {Object} res
 * @param username
 */
const refreshToken = (res: Response, username: string) => {
  res.set(
    'Token', signToken({ username })
  )
  res.set('Access-Control-Expose-Headers', '*, Token')
}

/**
 * checkAuthorization
 *
 * req.headers.authorization - The value from the header Authorization: Bearer <token>
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
const checkAuthorization = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', (err: any, user: IUser) => {
    /* istanbul ignore next — DB errors in Passport JWT verify are not reproducible in tests */
    if (err) {
      return next(err)
    }

    if (!user) {
      return next(Boom.unauthorized().output)
    }

    /* istanbul ignore else — user always has username when passport JWT verify succeeds */
    if (user.username) {
      refreshToken(res, user.username)
      req.user = user.username
    }
    next()
  })(req, res, next)
}

export default checkAuthorization
