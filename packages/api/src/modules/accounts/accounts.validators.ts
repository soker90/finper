import Joi from 'joi'
import Boom from '@hapi/boom'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import { accountsRepository } from './accounts.repository'

const createSchema = Joi.object({
  name: Joi.string().required(),
  bank: Joi.string().required(),
  balance: Joi.number()
})

const editSchema = Joi.alternatives().try(
  Joi.object({
    isActive: Joi.boolean()
  }).or('balance', 'isActive'),
  Joi.object({
    name: Joi.string().required(),
    bank: Joi.string().required(),
    balance: Joi.number().required()
  })
).required()

const transferSchema = Joi.object({
  sourceId: Joi.string().required(),
  destinationId: Joi.string().required().invalid(Joi.ref('sourceId')),
  amount: Joi.number().positive().required()
})

export const validateAccountCreateParams = (body: Record<string, any>): Record<string, any> => {
  const { error, value } = createSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validateAccountExist = async (id: string, user: string): Promise<void> => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exist = await accountsRepository.findById(id, user)
  if (!exist) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
}

export const validateAccountEditParams = async ({ params, body, user }: {
  params: Record<string, string>, body: Record<string, any>, user: string
}): Promise<{ id: string, value: Record<string, any> }> => {
  await validateAccountExist(params.id, user)

  const { error, value } = editSchema.validate(body)
  if (error) throw Boom.badData(error.message).output

  return { id: params.id, value }
}

export const validateAccountTransferParams = (body: Record<string, any>): Record<string, any> => {
  const { error, value } = transferSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}
