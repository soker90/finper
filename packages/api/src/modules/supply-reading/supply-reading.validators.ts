import Joi from 'joi'
import Boom from '@hapi/boom'
import { supplyReadingRepository } from './supply-reading.repository'
import { validateSupplyExist } from '../supply/supply.validators'
import { ERROR_MESSAGE } from '../../i18n'

export const validateReadingExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const reading = supplyReadingRepository.findById(id, user)
  if (!reading) {
    throw Boom.notFound(message || ERROR_MESSAGE.SUPPLY_READING.NOT_FOUND).output
  }
}

export const validateReadingCreateParams = async (data: Record<string, string | number>) => {
  if (data.supplyId) {
    await validateSupplyExist({ id: data.supplyId as string, user: data.user as string })
  }

  const schema = Joi.object({
    supplyId: Joi.string().required(),
    startDate: Joi.number().required(),
    endDate: Joi.number().required().greater(Joi.ref('startDate')).messages({
      'number.greater': ERROR_MESSAGE.SUPPLY_READING.INVALID_DATES
    }),
    amount: Joi.number().invalid(NaN).required(),
    consumption: Joi.number().optional(),
    consumptionPeak: Joi.number().optional(),
    consumptionFlat: Joi.number().optional(),
    consumptionOffPeak: Joi.number().optional(),
    user: Joi.string().required()
  })

  const { error, value } = schema.validate(data, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}

export const validateReadingEditParams = async ({ params, body, user }: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  /* istanbul ignore else — params.id is always present when editing via route (URL param) */
  if (params.id) {
    await validateReadingExist({ id: params.id, user })
  }

  /* istanbul ignore else — supplyId is always present in the body for edit requests */
  if (body.supplyId) {
    await validateSupplyExist({ id: body.supplyId, user })
  }

  const schema = Joi.object({
    supplyId: Joi.string().required(),
    startDate: Joi.number().required(),
    endDate: Joi.number().required().greater(Joi.ref('startDate')).messages({
      'number.greater': ERROR_MESSAGE.SUPPLY_READING.INVALID_DATES
    }),
    amount: Joi.number().invalid(NaN).required(),
    consumption: Joi.number().optional(),
    consumptionPeak: Joi.number().optional(),
    consumptionFlat: Joi.number().optional(),
    consumptionOffPeak: Joi.number().optional()
  })

  const { error, value } = schema.validate(body, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
