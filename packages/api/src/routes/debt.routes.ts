import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { debtService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { DebtController } from '../controllers/debt.controller'

export class DebtRoutes {
  router: Router

  public debtController: DebtController = new DebtController({
    debtService,
    loggerHandler: loggerHandler('DebtController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.post(
      '/',
      authMiddleware,
      this.debtController.create.bind(this.debtController)
    )

    this.router.get(
      '/',
      authMiddleware,
      this.debtController.debts.bind(this.debtController)
    )

    this.router.get(
      '/from/:from',
      authMiddleware,
      this.debtController.debtsFrom.bind(this.debtController)
    )

    this.router.put(
      '/:id',
      authMiddleware,
      this.debtController.edit.bind(this.debtController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.debtController.delete.bind(this.debtController)
    )
  }
}
