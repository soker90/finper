import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { budgetService } from '../services'
import { BudgetController } from '../controllers/budget.controller'
import authMiddleware from '../middlewares/auth.middleware'

export class BudgetRoutes {
  router: Router

  public budgetController: BudgetController = new BudgetController({
    budgetService,
    loggerHandler: loggerHandler('BudgetController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get(
      '/',
      authMiddleware,
      this.budgetController.budgets.bind(this.budgetController)
    )

    this.router.patch(
      '/:category/:year/:month',
      authMiddleware,
      this.budgetController.edit.bind(this.budgetController)
    )

    this.router.post(
      '/',
      authMiddleware,
      this.budgetController.copy.bind(this.budgetController)
    )
  }
}
