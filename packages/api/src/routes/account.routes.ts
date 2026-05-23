import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { AccountController } from '../controllers/account.controller'
import { accountService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

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
      asyncHandler(this.accountController.create.bind(this.accountController))
    )

    this.router.get(
      '/',
      authMiddleware,
      asyncHandler(this.accountController.accounts.bind(this.accountController))
    )

    this.router.patch(
      '/:id',
      authMiddleware,
      asyncHandler(this.accountController.edit.bind(this.accountController))
    )

    this.router.get(
      '/:id',
      authMiddleware,
      asyncHandler(this.accountController.account.bind(this.accountController))
    )

    this.router.post(
      '/transfer',
      authMiddleware,
      asyncHandler(this.accountController.transfer.bind(this.accountController))
    )
  }
}
