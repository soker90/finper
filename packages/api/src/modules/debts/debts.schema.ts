import Joi from 'joi'
import Boom from '@hapi/boom'
import { debtsRepository } from './debts.repository'
import { ERROR_MESSAGE } from '../../i18n'

// Constants to match the old schema
const DEBT = {
  FROM: 'from',
  TO: 'to'
} as const

export const validateDebtCreateParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
    from: Joi.string().required(),
    date: Joi.number(),
    amount: Joi.number().required(),
    paymentDate: Joi.number(),
    concept: Joi.string(),
    type: Joi.string().valid(DEBT.TO, DEBT.FROM).required(),
    user: Joi.string().required()
  })

  const { error, value } = schema.validate(data)
  if (error) throw Boom.badData(error.message).output

  // user is omitted from the return payload because the controller uses it directly
  delete value.user
  return value
}

export const validateDebtEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  const existing = await debtsRepository.findById(params.id, user)
  if (!existing) throw Boom.notFound(ERROR_MESSAGE.DEBT.NOT_FOUND).output

  const schema = Joi.object({
    from: Joi.string().required(),
    date: Joi.number(),
    amount: Joi.number().required(),
    paymentDate: Joi.number(),
    concept: Joi.string(),
    type: Joi.string().valid(DEBT.TO, DEBT.FROM).required()
  })

  const { error, value } = schema.validate(body)
  if (error) throw Boom.badData(error.message).output

  return value
}

export const validateDebtPayParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  const existing = await debtsRepository.findById(params.id, user)
  if (!existing) throw Boom.notFound(ERROR_MESSAGE.DEBT.NOT_FOUND).output

  const schema = Joi.object({
    amount: Joi.number().positive().required()
  })

  const { error, value } = schema.validate(body)
  if (error) throw Boom.badData(error.message).output

  return { amount: value.amount }
}
