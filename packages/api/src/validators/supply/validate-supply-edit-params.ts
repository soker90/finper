import Joi from 'joi'
import Boom from '@hapi/boom'
import { RequestUser } from '../../types'
import { validateSupplyExist } from './validate-supply-exist'
import { validatePropertyExist } from '../property'
import { SUPPLY_TYPE } from '@soker90/finper-models'

export const validateSupplyEditParams = async (data: RequestUser) => {
  if (data.params?.id) {
    await validateSupplyExist({ id: data.params.id, user: data.user as string })
  }

  if (data.body?.propertyId) {
    await validatePropertyExist({ id: data.body.propertyId as string, user: data.user as string })
  }

  const schema = Joi.object({
    propertyId: Joi.string().required(),
    name: Joi.when('type', {
      is: SUPPLY_TYPE.OTHER,
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    }),
    type: Joi.string().valid(...Object.values(SUPPLY_TYPE)).required(),
    contractedPowerPeak: Joi.number().optional(),
    contractedPowerOffPeak: Joi.number().optional(),
    currentPricePowerPeak: Joi.number().optional(),
    currentPricePowerOffPeak: Joi.number().optional(),
    currentPriceEnergyPeak: Joi.number().optional(),
    currentPriceEnergyFlat: Joi.number().optional(),
    currentPriceEnergyOffPeak: Joi.number().optional()
  })

  const { error, value } = schema.validate(data.body, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: data.params?.id, value }
}
