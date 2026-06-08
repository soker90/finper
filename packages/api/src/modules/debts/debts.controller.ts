import type { Request, Response } from 'express'
import { debtsService } from './debts.service'
import { debtsSerializer } from './debts.serializer'
import loggerHandler from '../../utils/logger'
import {
  validateDebtCreateParams,
  validateDebtEditParams,
  validateDebtPayParams,
  validateDebtExist
} from './debts.validators'

const logger = loggerHandler('DebtController')

export const debtsController = {
  async create (req: Request, res: Response) {
    const user = req.user as string
    logger.logInfo(`/create - debt: ${req.body.from}`)

    const params = validateDebtCreateParams({ body: req.body, user })
    const result = debtsService.addDebt(user, params as any)
    logger.logInfo('Debt has been succesfully created')

    res.status(201).json(debtsSerializer.toJson(result as any))
  },

  async getAll (req: Request, res: Response) {
    const user = req.user as string
    logger.logInfo(`/debts - list debts of ${user}`)

    const result = debtsService.getDebts(user)
    res.json({
      from: result.from.map(debtsSerializer.toJson),
      to: result.to.map(debtsSerializer.toJson),
      debtsByPerson: result.debtsByPerson
    })
  },

  async getFrom (req: Request, res: Response) {
    const user = req.user as string
    const from = req.params.from
    logger.logInfo(`/debts - list debts from ${from}`)

    const result = debtsService.getDebtsFrom(user, from)
    res.json(result.map(debtsSerializer.toJson))
  },

  async edit (req: Request, res: Response) {
    const user = req.user as string
    const id = req.params.id
    logger.logInfo(`/edit - debt: ${id}`)

    const value = validateDebtEditParams({ params: req.params, body: req.body, user })
    const result = debtsService.editDebt(value.id, user, value.value)
    logger.logInfo(`Debt ${id} has been succesfully edited`)

    res.json(debtsSerializer.toJson(result))
  },

  async delete (req: Request, res: Response) {
    const user = req.user as string
    const id = req.params.id
    logger.logInfo(`/delete - debt: ${id}`)

    validateDebtExist({ id, user })
    debtsService.deleteDebt(id, user)
    res.status(204).send()
  },

  async pay (req: Request, res: Response) {
    const user = req.user as string
    const id = req.params.id
    logger.logInfo(`/pay - debt: ${id}`)

    const value = validateDebtPayParams({ params: req.params, body: req.body, user })
    const result = debtsService.payDebt(value.id, user, value.amount)

    res.json(result ? debtsSerializer.toJson(result) : null)
  }
}
