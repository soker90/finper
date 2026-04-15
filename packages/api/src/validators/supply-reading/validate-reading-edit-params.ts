import Joi from 'joi'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'
import { RequestUser } from '../../types'
import { validateReadingExist } from './validate-reading-exist'
import { validateSupplyExist } from '../supply'

export const validateReadingEditParams = async (data: RequestUser) => {
  if (data.params?.id) {
    await validateReadingExist({ id: data.params.id, user: data.user as string })
  }

  if (data.body?.supplyId) {
    await validateSupplyExist({ id: data.body.supplyId as string, user: data.user as string })
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

  const { error, value } = schema.validate(data.body, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: data.params?.id, value }
}
