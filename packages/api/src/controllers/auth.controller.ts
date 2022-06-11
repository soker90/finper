import Boom from '@hapi/boom'
import passport from 'passport'
import { NextFunction, Request, Response } from 'express'

import { IUserService } from '../services/user.service'
import { IAuthService } from '../services/auth.service'
import validateLoginInputParams from '../validators/validate-login-input-params'
import validateRegisterInputParams from '../validators/validate-register-input-params'

import '../auth/local-strategy-passport-handler'

type IAccountController = {
    loggerHandler: any,
    userService: IUserService,
    authService: IAuthService,
}

export class AuthController {
  private logger

  private userService

  private authService

  constructor ({ loggerHandler, userService, authService }: IAccountController) {
    this.logger = loggerHandler
    this.userService = userService
    this.authService = authService
  }

  public async register (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ username }) => this.logger.logInfo(`/register - username: ${username && username.toLowerCase()}`))
      .then(validateRegisterInputParams)
      .then(this.userService.createUser.bind(this.userService))
      .tap(({ username }) => this.logger.logInfo(`User ${username} has been succesfully created`))
      .then(({ username }) => {
        const token = this.authService.getSignedToken(username)
        res.send({ token })
      })
      .catch((error) => {
        next(error)
      })
  }

  public login (req: Request, res: Response, next: NextFunction) {
    const { authService } = this
    Promise.resolve(req.body)
      .tap(({ username }) => this.logger.logInfo(`/login - user: ${username && username.toLowerCase()}`))
      .then(validateLoginInputParams)
      .then(() => {
        passport.authenticate('local', function (error, user) {
          if (error) {
            return next(error)
          }

          if (!user) {
            return next(Boom.unauthorized().output)
          }

          const token = authService.getSignedToken(user.username)

          res.send({ token })
        })(req, res, next)
      })
      .catch((error) => next(error))
  }

  public me (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(req)
      .then(() => res.status(204).send())
      .catch((error) => next(error))
  }
}
