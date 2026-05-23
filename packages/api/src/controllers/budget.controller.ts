import { Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { IBudgetService } from '../services/budget.service'
import { validateBudgetGet, validateBudgetEditParams, validateBudgetCopy } from '../validators/budget'

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

  public async budgets (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/budgets - list budgets of ${req.user} ${req.query?.month}/${req.query?.year}`)

    const filters = await validateBudgetGet(req.query as Record<string, any>)
    const response = await this.budgetService.getBudgets({ ...filters, user: req.user })

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - category: ${req.params.category}`)

    const params = await validateBudgetEditParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.budgetService.editBudget(params)

    this.logger.logInfo(`Budget for category ${response.category} has been succesfully edited`)
    res.send(response)
  }

  public async copy (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/copy - budget')

    const params = await validateBudgetCopy({ body: req.body, user: req.user })
    const response = await this.budgetService.copy(params)

    this.logger.logInfo('Budget has been succesfully copied')

    if (!response) {
      res.status(204).send()
    } else {
      res.status(201).send()
    }
  }
}
