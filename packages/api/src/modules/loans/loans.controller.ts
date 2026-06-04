import { Request, Response } from 'express'
import { LoansService } from './loans.service'
import {
  validateLoanCreateParams,
  validateLoanEditParams,
  validateLoanExist
} from './loans.schema'

export class LoansController {
  private logger
  private loansService: LoansService

  constructor ({ loggerHandler, loansService }: { loggerHandler: any, loansService: LoansService }) {
    this.logger = loggerHandler
    this.loansService = loansService
  }

  public async list (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/loans - list loans of ${req.user}`)
    res.send(this.loansService.getLoans(req.user as string))
  }

  public async detail (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id} - detail`)
    await validateLoanExist({ id, user: req.user as string })
    res.send(this.loansService.getLoanDetail(id, req.user as string))
  }

  public async create (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/loans/create - ${req.body.name}`)
    const params = await validateLoanCreateParams({ ...req.body, user: req.user })
    res.status(201).send(this.loansService.createLoan(params))
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/loans/edit - ${req.params.id}`)
    const { id, value } = await validateLoanEditParams({ params: req.params, body: req.body, user: req.user as string })
    res.send(this.loansService.editLoan(id, value))
  }

  public async remove (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/delete - ${id}`)
    await validateLoanExist({ id, user: req.user as string })
    this.loansService.deleteLoan(id)
    res.status(204).send()
  }
}
