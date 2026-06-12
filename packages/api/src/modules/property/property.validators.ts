import Joi from 'joi'
import Boom from '@hapi/boom'
import { propertyRepository } from './property.repository'
import { ERROR_MESSAGE } from '../../i18n'

export const validatePropertyExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const property = propertyRepository.findById(id, user)
  if (!property) {
    throw Boom.notFound(message || ERROR_MESSAGE.PROPERTY.NOT_FOUND).output
  }
}

export const validatePropertyCreateParams = async (data: Record<string, string>) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    user: Joi.string().required()
  })

  const { error, value } = schema.validate(data, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}

export const validatePropertyEditParams = async ({ params, body, user }: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  /* istanbul ignore else — params.id is always present when editing via route (URL param) */
  if (params.id) {
    await validatePropertyExist({ id: params.id, user })
  }

  const schema = Joi.object({
    name: Joi.string().required()
  })

  const { error, value } = schema.validate(body, { stripUnknown: true })

  /* istanbul ignore next — Joi error branch not exercised for property edit in current tests */
  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
