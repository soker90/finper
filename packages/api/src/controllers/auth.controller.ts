import Boom from '@hapi/boom'
import { IUser } from '@soker90/finper-models'
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

  public async register (req: Request, res: Response): Promise<void> {
    const { username } = req.body
    this.logger.logInfo(`/register - username: ${username?.toLowerCase()}`)
    const user = await validateRegisterInputParams(req.body)
    const created = await this.userService.createUser(user)
    this.logger.logInfo(`User ${created.username} has been succesfully created`)
    const token = this.authService.getSignedToken(created.username)
    res.send({ token })
  }

  public login (req: Request, res: Response, next: NextFunction): void {
    const { authService } = this
    this.logger.logInfo(`/login - user: ${req.body?.username?.toLowerCase()}`)
    validateLoginInputParams(req.body)
    passport.authenticate('local', function (error: any, user: IUser) {
      if (error) return next(error)
      if (!user) return next(Boom.unauthorized().output)
      const token = authService.getSignedToken(user.username)
      res.send({ token })
    })(req, res, next)
  }

  public me (_req: Request, res: Response): void {
    res.status(204).send()
  }
}
