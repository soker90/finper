import Joi from 'joi'
import Boom from '@hapi/boom'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import { creditCardsRepository } from './credit-cards.repository'
import type { CreateCreditCardData, UpdateCreditCardData, CreateCreditCardMovementData, UpdateCreditCardMovementData, PayDebtPayload, CreditCardRow } from './credit-cards.repository'

const createCardSchema = Joi.object({
  name: Joi.string().required(),
  accountId: Joi.string().required(),
  limit: Joi.number().min(0).allow(null)
})

const editCardSchema = Joi.object({
  name: Joi.string(),
  accountId: Joi.string(),
  limit: Joi.number().min(0).allow(null)
}).min(1)

const createMovementSchema = Joi.object({
  date: Joi.number().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('expense', 'income').default('expense'),
  categoryId: Joi.string().required(),
  storeId: Joi.string().allow(null, ''),
  note: Joi.string().allow(null, '')
})

const editMovementSchema = Joi.object({
  date: Joi.number(),
  amount: Joi.number().positive(),
  type: Joi.string().valid('expense', 'income'),
  categoryId: Joi.string(),
  storeId: Joi.string().allow(null, ''),
  note: Joi.string().allow(null, '')
}).min(1)

const payDebtSchema = Joi.object({
  movementIds: Joi.array().items(Joi.string()).min(1),
  amount: Joi.number().positive(),
  all: Joi.boolean()
}).or('movementIds', 'amount', 'all')

export const validateCreditCardCreateParams = (body: Record<string, any>): CreateCreditCardData => {
  const { error, value } = createCardSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validateCreditCardExist = async (id: string, user: string): Promise<CreditCardRow> => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exist = await creditCardsRepository.findById(id, user)
  if (!exist) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output
  return exist
}

export const validateCreditCardEditParams = async ({ params, body, user }: {
  params: Record<string, string>, body: Record<string, any>, user: string
}): Promise<{ id: string, value: UpdateCreditCardData }> => {
  await validateCreditCardExist(params.id, user)
  const { error, value } = editCardSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return { id: params.id, value }
}

export const validateCreditCardMovementCreateParams = (body: Record<string, any>): Omit<CreateCreditCardMovementData, 'creditCardId'> => {
  const { error, value } = createMovementSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validateCreditCardMovementEditParams = (body: Record<string, any>): UpdateCreditCardMovementData => {
  const { error, value } = editMovementSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validateCreditCardPayDebtParams = (body: Record<string, any>): PayDebtPayload => {
  const { error, value } = payDebtSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}
