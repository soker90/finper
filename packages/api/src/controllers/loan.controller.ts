import { NextFunction, Request, Response } from 'express'

import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'
import { tap } from '../utils/promise'
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

  public async list (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .then(tap((user) => this.logger.logInfo(`/loans - list loans of ${user}`)))
      .then(this.loanService.getLoans.bind(this.loanService))
      .then((response) => res.send(response))
      .catch(next)
  }

  public async detail (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id, user: req.user as string })
      .then(tap(({ id }) => this.logger.logInfo(`/loans/${id} - detail`)))
      .then(tap(({ id }) => validateLoanExist({ id, user: req.user as string })))
      .then(({ id }) => this.loanService.getLoanDetail(id, req.user as string))
      .then((response) => res.send(response))
      .catch(next)
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .then(tap(({ name }) => this.logger.logInfo(`/loans/create - ${name}`)))
      .then(extractUser(req))
      .then(validateLoanCreateParams)
      .then(this.loanService.createLoan.bind(this.loanService))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .then(tap(({ params }) => this.logger.logInfo(`/loans/edit - ${params?.id}`)))
      .then(validateLoanEditParams)
      .then(({ id, value }) => this.loanService.editLoan(id, value))
      .then((response) => res.send(response))
      .catch(next)
  }

  public async remove (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params.id)
      .then(tap((id) => this.logger.logInfo(`/loans/delete - ${id}`)))
      .then(tap(() => validateLoanExist({ id: req.params.id, user: req.user as string })))
      .then(this.loanService.deleteLoan.bind(this.loanService))
      .then(() => res.status(204).send())
      .catch(next)
  }

  public async payOrdinary (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    Promise.resolve(req.body)
      .then(tap(() => this.logger.logInfo(`/loans/${id}/pay - ordinary payment`)))
      .then(tap(() => validateLoanExist({ id, user })))
      .then(validateLoanOrdinaryPaymentParams)
      .then((params) => this.loanService.payOrdinary(id, user, params))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async payExtraordinary (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    Promise.resolve(req.body)
      .then(tap(() => this.logger.logInfo(`/loans/${id}/amortize - extraordinary`)))
      .then(tap(() => validateLoanExist({ id, user })))
      .then(validateLoanPaymentParams)
      .then(({ amount, mode, date, addMovement }) => this.loanService.payExtraordinary(id, amount, mode, user, addMovement, date))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async addEvent (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    Promise.resolve({ ...req.body, user })
      .then(tap(() => this.logger.logInfo(`/loans/${id}/events - add event`)))
      .then(tap(() => validateLoanExist({ id, user })))
      .then(validateLoanEventParams)
      .then((data) => this.loanService.addEvent(id, data))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async deletePayment (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id, paymentId } = req.params
    const user = req.user as string
    Promise.resolve({ id, paymentId, user })
      .then(tap(() => this.logger.logInfo(`/loans/${id}/payments/${paymentId} - delete payment`)))
      .then(tap(() => validateLoanExist({ id, user })))
      .then(() => this.loanService.deletePayment(id, paymentId, user))
      .then(() => res.status(204).send())
      .catch(next)
  }

  public async editPayment (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id, paymentId } = req.params
    const user = req.user as string
    Promise.resolve({ ...req.body, user, paymentId })
      .then(tap(() => this.logger.logInfo(`/loans/${id}/payments/${paymentId} - edit payment`)))
      .then(tap(() => validateLoanExist({ id, user })))
      .then(validateLoanEditPaymentParams)
      .then((data) => this.loanService.editPayment(id, paymentId, data, user))
      .then((response) => res.send(response))
      .catch(next)
  }

  public async simulatePayoff (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    Promise.resolve(req.body)
      .then(tap(() => this.logger.logInfo(`/loans/${id}/simulate-payoff`)))
      .then(tap(() => validateLoanExist({ id, user })))
      .then(validateLoanSimulateParams)
      .then(({ lumpSum }) => this.loanService.simulatePayoff(id, lumpSum, user))
      .then((response) => res.send(response))
      .catch(next)
  }
}
