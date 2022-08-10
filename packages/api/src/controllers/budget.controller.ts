import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { IBudgetService } from '../services/budget.service'
import extractUser from '../helpers/extract-user'
import { validateBudgetGet } from '../validators/budget'

type IBudgetController = {
    loggerHandler: any,
    budgetService: IBudgetService,
}

export class BudgetController {
  private logger

  private budgetService

  constructor ({ loggerHandler, budgetService }: IBudgetController) {
    this.logger = loggerHandler
    this.budgetService = budgetService
  }

  public async budgets (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.query)
      .tap(() => this.logger.logInfo(`/budgets - list budgets of ${req.user} ${req.query?.month}/${req.query?.year}`))
      .tap(validateBudgetGet)
      .then(extractUser(req))
      .then(this.budgetService.getBudgets.bind(this.budgetService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }
}
