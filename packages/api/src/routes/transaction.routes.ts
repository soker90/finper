import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { storeService, transactionService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { TransactionController } from '../controllers/transaction.controller'

export class TransactionRoutes {
  router: Router

  public accountController: TransactionController = new TransactionController({
    transactionService,
    storeService,
    loggerHandler: loggerHandler('TransactionController')
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
      this.accountController.transactions.bind(this.accountController)
    )
  }
}
