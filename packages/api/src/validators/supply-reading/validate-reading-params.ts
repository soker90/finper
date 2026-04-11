import Joi from 'joi'
import Boom from '@hapi/boom'
import { ISupplyReading } from '@soker90/finper-models'
import { validateReadingExist } from './validate-reading-exist'
import { validateSupplyExist } from '../supply/validate-supply-exist'
import { ERROR_MESSAGE } from '../../i18n'

export const validateReadingParams = async ({ params, body, user }: { params?: Record<string, string>, body: Record<string, string>, user: string }): Promise<{ id?: string, value: ISupplyReading }> => {
  if (params?.id) {
    await validateReadingExist({ id: params.id, user })
  }

  if (body.supplyId) {
    await validateSupplyExist({ id: body.supplyId, user, message: ERROR_MESSAGE.SUPPLY.NOT_FOUND })
  }

  const schema = Joi.object({
    supplyId: Joi.string().required(),
    startDate: Joi.number().required(),
    endDate: Joi.number().required(),
    consumption: Joi.number().optional(),
    consumptionPeak: Joi.number().optional(),
    consumptionFlat: Joi.number().optional(),
    consumptionOffPeak: Joi.number().optional()
  })

  const { error, value } = schema.validate(body, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params?.id, value: value as ISupplyReading }
}
