import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'
import { IDebtService } from '../services/debt.service'
import { validateDebtCreateParams, validateDebtEditParams, validateDebtExist } from '../validators/debt'

type IDebtController = {
    loggerHandler: any,
    debtService: IDebtService,
}

export class DebtController {
  private logger

  private debtService

  constructor ({ loggerHandler, debtService }: IDebtController) {
    this.logger = loggerHandler
    this.debtService = debtService
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ from }) => this.logger.logInfo(`/create - debt: ${from}`))
      .then(extractUser(req))
      .then(validateDebtCreateParams)
      .then(this.debtService.addDebt.bind(this.debtService))
      .tap(() => this.logger.logInfo('Debt has been succesfully created'))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async debts (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap((user: string) => this.logger.logInfo(`/debts - list debts of ${user}`))
      .then(this.debtService.getDebts.bind(this.debtService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }

  public async debtsFrom (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params)
      .tap(() => this.logger.logInfo(`/debts - list debts from ${req.params?.from}`))
      .then(extractUser(req))
      .then(this.debtService.getDebtsFrom.bind(this.debtService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .tap(({ params }) => this.logger.logInfo(`/edit - debt: ${params?.id}`))
      .then(validateDebtEditParams)
      .then(this.debtService.editDebt.bind(this.debtService))
      .tap(({ _id }) => this.logger.logInfo(`Debt ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params.id)
      .tap((id) => this.logger.logInfo(`/delete - category: ${id}`))
      .tap(validateDebtExist.bind(null, { id: req.params.id, user: req.user as string }))
      .then(this.debtService.deleteDebt.bind(this.debtService))
      .then(() => {
        res.status(204).send()
      })
      .catch((error) => {
        next(error)
      })
  }
}
