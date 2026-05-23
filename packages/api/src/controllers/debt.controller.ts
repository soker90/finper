import { Request, Response } from 'express'

import { IDebtService } from '../services/debt.service'
import { validateDebtCreateParams, validateDebtEditParams, validateDebtExist, validateDebtPayParams } from '../validators/debt'

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

  public async create (req: Request, res: Response): Promise<void> {
    const { from } = req.body
    this.logger.logInfo(`/create - debt: ${from}`)

    const params = await validateDebtCreateParams({ ...req.body, user: req.user })
    const response = await this.debtService.addDebt(params)
    this.logger.logInfo('Debt has been succesfully created')

    res.send(response)
  }

  public async debts (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/debts - list debts of ${req.user}`)

    const response = await this.debtService.getDebts(req.user)

    res.send(response)
  }

  public async debtsFrom (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/debts - list debts from ${req.params.from}`)

    const response = await this.debtService.getDebtsFrom({ user: req.user, from: req.params.from })

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - debt: ${req.params.id}`)

    const { id, value } = await validateDebtEditParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.debtService.editDebt({ id, value })
    this.logger.logInfo(`Debt ${response._id} has been succesfully edited`)

    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - debt: ${id}`)

    await validateDebtExist({ id, user: req.user })
    await this.debtService.deleteDebt(id)

    res.status(204).send()
  }

  public async pay (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/pay - debt: ${req.params.id}`)

    const { id, amount } = await validateDebtPayParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.debtService.payDebt({ id, amount })

    if (response === null) {
      res.status(204).send()
    } else {
      res.send(response)
    }
  }
}
