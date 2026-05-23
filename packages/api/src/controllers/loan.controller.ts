import { Request, Response } from 'express'

import { ILoanService } from '../services/loan.service'
import {
  validateLoanCreateParams,
  validateLoanEditParams,
  validateLoanExist,
  validateLoanPaymentParams,
  validateLoanEventParams,
  validateLoanEditPaymentParams,
  validateLoanOrdinaryPaymentParams,
  validateLoanSimulateParams
} from '../validators/loan'

type ILoanController = {
  loggerHandler: any
  loanService: ILoanService
}

export class LoanController {
  private logger
  private loanService

  constructor ({ loggerHandler, loanService }: ILoanController) {
    this.logger = loggerHandler
    this.loanService = loanService
  }

  public async list (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/loans - list loans of ${req.user}`)

    const response = await this.loanService.getLoans(req.user)
    res.send(response)
  }

  public async detail (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id} - detail`)

    await validateLoanExist({ id, user: req.user })
    const response = await this.loanService.getLoanDetail(id, req.user)

    res.send(response)
  }

  public async create (req: Request, res: Response): Promise<void> {
    const { name } = req.body
    this.logger.logInfo(`/loans/create - ${name}`)

    const params = await validateLoanCreateParams({ ...req.body, user: req.user })
    const response = await this.loanService.createLoan(params)

    res.status(201).send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/loans/edit - ${req.params.id}`)

    const { id, value } = await validateLoanEditParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.loanService.editLoan(id, value)

    res.send(response)
  }

  public async remove (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/delete - ${id}`)

    await validateLoanExist({ id, user: req.user })
    await this.loanService.deleteLoan(id)

    res.status(204).send()
  }

  public async payOrdinary (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/pay - ordinary payment`)

    await validateLoanExist({ id, user: req.user })
    const params = await validateLoanOrdinaryPaymentParams(req.body)
    const response = await this.loanService.payOrdinary(id, req.user, params)

    res.status(201).send(response)
  }

  public async payExtraordinary (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/amortize - extraordinary`)

    await validateLoanExist({ id, user: req.user })
    const { amount, mode, date, addMovement } = await validateLoanPaymentParams(req.body)
    const response = await this.loanService.payExtraordinary(id, amount, mode, req.user, addMovement, date)

    res.status(201).send(response)
  }

  public async addEvent (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/events - add event`)

    await validateLoanExist({ id, user: req.user })
    const data = await validateLoanEventParams({ ...req.body, user: req.user })
    const response = await this.loanService.addEvent(id, data)

    res.status(201).send(response)
  }

  public async deletePayment (req: Request, res: Response): Promise<void> {
    const { id, paymentId } = req.params
    this.logger.logInfo(`/loans/${id}/payments/${paymentId} - delete payment`)

    await validateLoanExist({ id, user: req.user })
    await this.loanService.deletePayment(id, paymentId, req.user)

    res.status(204).send()
  }

  public async editPayment (req: Request, res: Response): Promise<void> {
    const { id, paymentId } = req.params
    this.logger.logInfo(`/loans/${id}/payments/${paymentId} - edit payment`)

    await validateLoanExist({ id, user: req.user })
    const data = await validateLoanEditPaymentParams({ ...req.body, user: req.user, paymentId })
    const response = await this.loanService.editPayment(id, paymentId, data, req.user)

    res.send(response)
  }

  public async simulatePayoff (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/loans/${id}/simulate-payoff`)

    await validateLoanExist({ id, user: req.user })
    const { lumpSum } = await validateLoanSimulateParams(req.body)
    const response = await this.loanService.simulatePayoff(id, lumpSum, req.user)

    res.send(response)
  }
}
