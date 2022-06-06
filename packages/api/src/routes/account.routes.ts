import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { AccountController } from '../controllers/account.controller'
import { accountService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'

export class AccountRoutes {
  router: Router

  public accountController: AccountController = new AccountController({
    accountService,
    loggerHandler: loggerHandler('AccountController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.post(
      '/create',
      authMiddleware,
      this.accountController.create.bind(this.accountController)
    )
  }
}
