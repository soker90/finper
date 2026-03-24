import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { storeService, transactionService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { TransactionController } from '../controllers/transaction.controller'

export class TransactionRoutes {
  router: Router

  public transactionController: TransactionController = new TransactionController({
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
      this.transactionController.create.bind(this.transactionController)
    )

    this.router.get(
      '/',
      authMiddleware,
      this.transactionController.transactions.bind(this.transactionController)
    )

    this.router.put(
      '/:id',
      authMiddleware,
      this.transactionController.edit.bind(this.transactionController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.transactionController.delete.bind(this.transactionController)
    )
  }
}
