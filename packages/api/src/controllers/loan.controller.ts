import { NextFunction, Request, Response } from 'express'

import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'
import { ILoanService } from '../services/loan.service'
import {
  validateLoanCreateParams,
  validateLoanEditParams,
  validateLoanExist,
  validateLoanPaymentParams,
  validateLoanEventParams,
  validateLoanImportPaymentParams,
  validateLoanEditPaymentParams,
  validateLoanOrdinaryPaymentParams
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
      .tap((user) => this.logger.logInfo(`/loans - list loans of ${user}`))
      .then(this.loanService.getLoans.bind(this.loanService))
      .then((response) => res.send(response))
      .catch(next)
  }

  public async detail (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id, user: req.user as string })
      .tap(({ id }) => this.logger.logInfo(`/loans/${id} - detail`))
      .tap(({ id }) => validateLoanExist({ id, user: req.user as string }))
      .then(({ id }) => this.loanService.getLoanDetail(id, req.user as string))
      .then((response) => res.send(response))
      .catch(next)
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ name }) => this.logger.logInfo(`/loans/create - ${name}`))
      .then(extractUser(req))
      .then(validateLoanCreateParams)
      .then(this.loanService.createLoan.bind(this.loanService))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .tap(({ params }) => this.logger.logInfo(`/loans/edit - ${params?.id}`))
      .then(validateLoanEditParams)
      .then(({ id, value }) => this.loanService.editLoan(id, value))
      .then((response) => res.send(response))
      .catch(next)
  }

  public async remove (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params.id)
      .tap((id) => this.logger.logInfo(`/loans/delete - ${id}`))
      .tap(() => validateLoanExist({ id: req.params.id, user: req.user as string }))
      .then(this.loanService.deleteLoan.bind(this.loanService))
      .then(() => res.status(204).send())
      .catch(next)
  }

  public async payOrdinary (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo(`/loans/${id}/pay - ordinary payment`))
      .tap(() => validateLoanExist({ id, user }))
      .then(validateLoanOrdinaryPaymentParams)
      .then((params) => this.loanService.payOrdinary(id, user, params))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async payExtraordinary (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo(`/loans/${id}/amortize - extraordinary`))
      .tap(() => validateLoanExist({ id, user }))
      .then(validateLoanPaymentParams)
      .then(({ amount, mode, date, addMovement }) => this.loanService.payExtraordinary(id, amount, mode, user, addMovement, date))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async addEvent (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    Promise.resolve({ ...req.body, user })
      .tap(() => this.logger.logInfo(`/loans/${id}/events - add event`))
      .tap(() => validateLoanExist({ id, user }))
      .then(validateLoanEventParams)
      .then((data) => this.loanService.addEvent(id, data))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async deletePayment (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id, paymentId } = req.params
    const user = req.user as string
    Promise.resolve({ id, paymentId, user })
      .tap(() => this.logger.logInfo(`/loans/${id}/payments/${paymentId} - delete payment`))
      .tap(() => validateLoanExist({ id, user }))
      .then(() => this.loanService.deletePayment(id, paymentId, user))
      .then(() => res.status(204).send())
      .catch(next)
  }

  public async importPayment (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    Promise.resolve({ ...req.body, user })
      .tap(() => this.logger.logInfo(`/loans/${id}/payments/import - import historical payment`))
      .tap(() => validateLoanExist({ id, user }))
      .then(validateLoanImportPaymentParams)
      .then((data) => this.loanService.importPayment(id, data, user))
      .then((response) => res.status(201).send(response))
      .catch(next)
  }

  public async editPayment (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id, paymentId } = req.params
    const user = req.user as string
    Promise.resolve({ ...req.body, user, paymentId })
      .tap(() => this.logger.logInfo(`/loans/${id}/payments/${paymentId} - edit payment`))
      .tap(() => validateLoanExist({ id, user }))
      .then(validateLoanEditPaymentParams)
      .then((data) => this.loanService.editPayment(id, paymentId, data, user))
      .then((response) => res.send(response))
      .catch(next)
  }
}
