import type { Request, Response } from 'express'
import { debtsService } from './debts.service'
import { debtsSerializer } from './debts.serializer'
import loggerHandler from '../../utils/logger'
import {
  validateDebtCreateParams,
  validateDebtEditParams,
  validateDebtPayParams
} from './debts.schema'
import { isValidId } from '../../utils'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

const logger = loggerHandler('DebtController')

export const debtsController = {
  async create (req: Request, res: Response) {
    const user = req.user as string
    logger.logInfo(`/create - debt: ${req.body.from}`)

    const params = await validateDebtCreateParams({ ...req.body, user })
    const result = await debtsService.addDebt(user, params)
    logger.logInfo('Debt has been succesfully created')

    res.status(201).json(debtsSerializer.toJson(result as any))
  },

  async getAll (req: Request, res: Response) {
    const user = req.user as string
    logger.logInfo(`/debts - list debts of ${user}`)

    const result = await debtsService.getDebts(user)
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

    const result = await debtsService.getDebtsFrom(user, from)
    res.json(result.map(debtsSerializer.toJson))
  },

  async edit (req: Request, res: Response) {
    const user = req.user as string
    const id = req.params.id
    if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.DEBT.NOT_FOUND).output

    logger.logInfo(`/edit - debt: ${id}`)

    const value = await validateDebtEditParams({ params: req.params, body: req.body, user })
    const result = await debtsService.editDebt(id, user, value)
    logger.logInfo(`Debt ${id} has been succesfully edited`)

    res.json(debtsSerializer.toJson(result))
  },

  async delete (req: Request, res: Response) {
    const user = req.user as string
    const id = req.params.id
    if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.DEBT.NOT_FOUND).output

    logger.logInfo(`/delete - debt: ${id}`)

    await debtsService.deleteDebt(id, user)
    res.status(204).send()
  },

  async pay (req: Request, res: Response) {
    const user = req.user as string
    const id = req.params.id
    if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.DEBT.NOT_FOUND).output

    logger.logInfo(`/pay - debt: ${id}`)

    const { amount } = await validateDebtPayParams({ params: req.params, body: req.body, user })
    const result = await debtsService.payDebt(id, user, amount)

    res.json(result ? debtsSerializer.toJson(result) : null)
  }
}
