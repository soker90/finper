import { Request, Response } from 'express'
import { BudgetsService } from './budgets.service'
import { validateBudgetGet, validateBudgetEditParams, validateBudgetCopy } from './budgets.validators'

export class BudgetsController {
  private logger
  private budgetsService: BudgetsService

  constructor ({ loggerHandler, budgetsService }: { loggerHandler: any, budgetsService: BudgetsService }) {
    this.logger = loggerHandler
    this.budgetsService = budgetsService
  }

  public budgets (req: Request, res: Response): void {
    this.logger.logInfo(`/budgets - get ${req.query.year}`)
    const filters = validateBudgetGet(req.query as Record<string, any>)
    res.send(this.budgetsService.getBudgets({ ...filters, user: req.user as string }))
  }

  public edit (req: Request, res: Response): void {
    this.logger.logInfo(`/budgets/edit - ${req.params.category}`)
    const params = validateBudgetEditParams({ params: req.params, body: req.body, user: req.user as string })
    res.send(this.budgetsService.editBudget(params))
  }

  public copy (req: Request, res: Response): void {
    this.logger.logInfo('/budgets/copy')
    const params = validateBudgetCopy({ body: req.body, user: req.user as string })
    const result = this.budgetsService.copy(params)
    res.send({ success: result })
  }
}
