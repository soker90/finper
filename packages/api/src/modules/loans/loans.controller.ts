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
} from './loans.validators'

export class LoansController {
  private logger
  private loansService: LoansService

  constructor ({ loggerHandler, loansService }: { loggerHandler: any, loansService: LoansService }) {
    this.logger = loggerHandler
    this.loansService = loansService
  }

  public list (req: Request, res: Response): void {
    this.logger.logInfo(`/loans - list loans of ${req.user}`)
    res.send(this.loansService.getLoans(req.user))
  }

  public detail (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id} - detail`)
    validateLoanExist({ id, user: req.user })
    res.send(this.loansService.getLoanDetail(id, req.user))
  }

  public create (req: Request, res: Response): void {
    this.logger.logInfo(`/loans/create - ${req.body.name}`)
    const params = validateLoanCreateParams({ ...req.body, user: req.user })
    res.status(201).send(this.loansService.createLoan(params))
  }

  public edit (req: Request, res: Response): void {
    this.logger.logInfo(`/loans/edit - ${req.params.id}`)
    const { id, value } = validateLoanEditParams({ params: req.params, body: req.body, user: req.user })
    res.send(this.loansService.editLoan(id, value))
  }

  public remove (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/loans/delete - ${id}`)
    validateLoanExist({ id, user: req.user })
    this.loansService.deleteLoan(id)
    res.status(204).send()
  }

  // --- Parte B: pagos ---

  public payOrdinary (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/pay - ordinary payment`)
    validateLoanExist({ id, user: req.user })
    const params = validateLoanOrdinaryPaymentParams(req.body)
    res.status(201).send(this.loansService.payOrdinary(id, req.user, params))
  }

  public payExtraordinary (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/amortize - extraordinary`)
    validateLoanExist({ id, user: req.user })
    const { amount, mode, date, addMovement } = validateLoanPaymentParams(req.body)
    res.status(201).send(this.loansService.payExtraordinary(id, amount, mode, req.user, addMovement, date))
  }

  public deletePayment (req: Request, res: Response): void {
    const { id, paymentId } = req.params
    this.logger.logInfo(`/loans/${id}/payments/${paymentId} - delete payment`)
    validateLoanExist({ id, user: req.user })
    this.loansService.deletePayment(id, paymentId, req.user)
    res.status(204).send()
  }

  public editPayment (req: Request, res: Response): void {
    const { id, paymentId } = req.params
    this.logger.logInfo(`/loans/${id}/payments/${paymentId} - edit payment`)
    validateLoanExist({ id, user: req.user })
    const data = validateLoanEditPaymentParams({ ...req.body, user: req.user })
    res.send(this.loansService.editPayment(id, paymentId, data, req.user))
  }

  // --- Parte C: eventos / simulación ---

  public addEvent (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/events - add event`)
    validateLoanExist({ id, user: req.user })
    const data = validateLoanEventParams({ ...req.body, user: req.user })
    res.status(201).send(this.loansService.addEvent(id, data))
  }

  public simulatePayoff (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/simulate-payoff`)
    validateLoanExist({ id, user: req.user })
    const { lumpSum } = validateLoanSimulateParams(req.body)
    res.send(this.loansService.simulatePayoff(id, lumpSum, req.user))
  }
}
