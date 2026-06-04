import { Request, Response } from 'express'
import { BudgetsService } from './budgets.service'
import { validateBudgetEditParams, validateBudgetCopy } from './budgets.schema'

export class BudgetsController {
  private logger
  private budgetsService: BudgetsService

  constructor ({ loggerHandler, budgetsService }: { loggerHandler: any, budgetsService: BudgetsService }) {
    this.logger = loggerHandler
    this.budgetsService = budgetsService
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/budgets/edit - ${req.params.category}`)
    const params = await validateBudgetEditParams({ params: req.params, body: req.body, user: req.user as string })
    res.send(this.budgetsService.editBudget(params))
  }

  public async copy (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/budgets/copy')
    const params = await validateBudgetCopy({ body: req.body, user: req.user as string })
    const result = this.budgetsService.copy(params)
    res.send({ success: result })
  }
}
