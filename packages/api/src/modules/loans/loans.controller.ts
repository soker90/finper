import { Request, Response } from 'express'
import { LoansService } from './loans.service'
import {
  validateLoanCreateParams,
  validateLoanEditParams,
  validateLoanExist,
  validateLoanOrdinaryPaymentParams,
  validateLoanPaymentParams,
  validateLoanEditPaymentParams,
  validateLoanEventParams,
  validateLoanSimulateParams
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

  // --- Parte B: pagos ---

  public async payOrdinary (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/pay - ordinary payment`)
    await validateLoanExist({ id, user: req.user as string })
    const params = await validateLoanOrdinaryPaymentParams(req.body)
    res.status(201).send(this.loansService.payOrdinary(id, req.user as string, params))
  }

  public async payExtraordinary (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/amortize - extraordinary`)
    await validateLoanExist({ id, user: req.user as string })
    const { amount, mode, date, addMovement } = await validateLoanPaymentParams(req.body)
    res.status(201).send(this.loansService.payExtraordinary(id, amount, mode, req.user as string, addMovement, date))
  }

  public async deletePayment (req: Request, res: Response): Promise<void> {
    const { id, paymentId } = req.params
    this.logger.logInfo(`/loans/${id}/payments/${paymentId} - delete payment`)
    await validateLoanExist({ id, user: req.user as string })
    this.loansService.deletePayment(id, paymentId, req.user as string)
    res.status(204).send()
  }

  public async editPayment (req: Request, res: Response): Promise<void> {
    const { id, paymentId } = req.params
    this.logger.logInfo(`/loans/${id}/payments/${paymentId} - edit payment`)
    await validateLoanExist({ id, user: req.user as string })
    const data = await validateLoanEditPaymentParams({ ...req.body, user: req.user })
    res.send(this.loansService.editPayment(id, paymentId, data, req.user as string))
  }

  // --- Parte C: eventos / simulación ---

  public async addEvent (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/events - add event`)
    await validateLoanExist({ id, user: req.user as string })
    const data = await validateLoanEventParams({ ...req.body, user: req.user })
    res.status(201).send(this.loansService.addEvent(id, data))
  }

  public async simulatePayoff (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/simulate-payoff`)
    await validateLoanExist({ id, user: req.user as string })
    const { lumpSum } = await validateLoanSimulateParams(req.body)
    res.send(this.loansService.simulatePayoff(id, lumpSum, req.user as string))
  }
}
