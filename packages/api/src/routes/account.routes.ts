import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { AccountController } from '../controllers/account.controller'
import { accountService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'

export class AccountRoutes {
  router: Router

  private accountController: AccountController = new AccountController({
    accountService,
    loggerHandler: loggerHandler('AccountController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.post(
      '/',
      authMiddleware,
      this.accountController.create.bind(this.accountController)
    )

    this.router.get(
      '/',
      authMiddleware,
      this.accountController.accounts.bind(this.accountController)
    )

    // POST /:id/adjust must be registered before PATCH /:id to avoid Express param conflicts
    this.router.post(
      '/:id/adjust',
      authMiddleware,
      this.accountController.adjust.bind(this.accountController)
    )

    this.router.patch(
      '/:id',
      authMiddleware,
      this.accountController.edit.bind(this.accountController)
    )

    this.router.get(
      '/:id',
      authMiddleware,
      this.accountController.account.bind(this.accountController)
    )

    this.router.post(
      '/transfer',
      authMiddleware,
      this.accountController.transfer.bind(this.accountController)
    )
  }
}
