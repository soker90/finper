import Joi from 'joi'
import Boom from '@hapi/boom'
import { debtsRepository } from './debts.repository'
import { ERROR_MESSAGE } from '../../i18n'
import { isValidId } from '../../utils'

export const DEBT = {
  FROM: 'from',
  TO: 'to'
} as const

const createSchema = Joi.object({
  from: Joi.string().required(),
  date: Joi.number(),
  amount: Joi.number().required(),
  paymentDate: Joi.number(),
  concept: Joi.string(),
  type: Joi.string().valid(DEBT.TO, DEBT.FROM).required(),
  user: Joi.string().required()
})

const editSchema = Joi.object({
  from: Joi.string().required(),
  date: Joi.number(),
  amount: Joi.number().required(),
  paymentDate: Joi.number(),
  concept: Joi.string(),
  type: Joi.string().valid(DEBT.TO, DEBT.FROM).required()
})

const paySchema = Joi.object({
  amount: Joi.number().positive().required()
})

export const validateDebtExist = ({ id, message, user }: { id: string, message?: string, user: string }): void => {
  if (!isValidId(id)) {
    throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  }
  const exist = debtsRepository.findById(id, user)
  if (!exist) {
    throw Boom.notFound(message ?? ERROR_MESSAGE.DEBT.NOT_FOUND).output
  }
}

export const validateDebtCreateParams = ({ body, user }: { body: Record<string, any>, user: string }): Record<string, any> => {
  const { error, value } = createSchema.validate({ ...body, user })
  if (error) {
    throw Boom.badData(error.message).output
  }

  delete value.user
  return value
}

export const validateDebtEditParams = ({ params, body, user }: {
  params: Record<string, string>, body: Record<string, any>, user: string
}): { id: string, value: Record<string, any> } => {
  validateDebtExist({ id: params.id, user })

  const { error, value } = editSchema.validate(body)
  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}

export const validateDebtPayParams = ({ params, body, user }: {
  params: Record<string, string>, body: Record<string, any>, user: string
}): { id: string, amount: number } => {
  validateDebtExist({ id: params.id, user })

  const { error, value } = paySchema.validate(body)
  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, amount: value.amount }
}
