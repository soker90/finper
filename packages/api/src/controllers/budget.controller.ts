import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { IBudgetService } from '../services/budget.service'
import extractUser from '../helpers/extract-user'
import { validateBudgetGet, validateBudgetEditParams, validateBudgetCopy } from '../validators/budget'
import { RequestUser } from '../types'

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
      .then(validateBudgetGet)
      .then(extractUser(req))
      .then(this.budgetService.getBudgets.bind(this.budgetService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .tap(({ params }) => this.logger.logInfo(`/edit - category: ${params.category}`))
      .then(validateBudgetEditParams)
      .then(this.budgetService.editBudget.bind(this.budgetService))
      .tap(({ category }) => this.logger.logInfo(`Budget for category ${category} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async copy (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .tap(() => this.logger.logInfo('/copy - badget'))
      .then(validateBudgetCopy)
      .then(this.budgetService.copy.bind(this.budgetService))
      .tap(() => this.logger.logInfo('Budget has been succesfully copied'))
      .then((response) => {
        if (response === null) {
          res.status(204).send()
        } else {
          res.status(201).send()
        }
      })
      .catch((error) => {
        next(error)
      })
  }
}
