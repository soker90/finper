import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { AuthController } from '../controllers/auth.controller'
import { userService, authService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

export class AuthRoutes {
  router: Router

  private accountController: AuthController = new AuthController({
    userService,
    authService,
    loggerHandler: loggerHandler('AuthController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.post(
      '/login',
      asyncHandler(this.accountController.login.bind(this.accountController))
    )

    this.router.post(
      '/register',
      asyncHandler(this.accountController.register.bind(this.accountController))
    )

    this.router.get(
      '/me',
      authMiddleware,
      asyncHandler(this.accountController.me.bind(this.accountController))
    )
  }
}
