import Joi from 'joi'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'
import { validateReadingExist } from './validate-reading-exist'
import { validateSupplyExist } from '../supply'

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
