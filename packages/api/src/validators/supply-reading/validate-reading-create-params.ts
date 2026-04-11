import Joi from 'joi'
import Boom from '@hapi/boom'
import { validateSupplyExist } from '../supply'

export const validateReadingCreateParams = async (data: Record<string, string | number>) => {
  if (data.supplyId) {
    await validateSupplyExist({ id: data.supplyId as string, user: data.user as string })
  }

  const schema = Joi.object({
    supplyId: Joi.string().required(),
    startDate: Joi.number().required(),
    endDate: Joi.number().required(),
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
