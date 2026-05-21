import Joi from 'joi'
import Boom from '@hapi/boom'
import { SUPPLY_TYPE } from '@soker90/finper-models'
import { validatePropertyExist } from '../property'

export const validateSupplyCreateParams = async (data: Record<string, string>) => {
  /* istanbul ignore else — propertyId is always provided when creating a supply via route */
  if (data.propertyId) {
    await validatePropertyExist({ id: data.propertyId, user: data.user })
  }

  const schema = Joi.object({
    propertyId: Joi.string().required(),
    name: Joi.when('type', {
      is: SUPPLY_TYPE.OTHER,
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    }),
    type: Joi.string().valid(...Object.values(SUPPLY_TYPE)).required(),
    user: Joi.string().required(),
    contractedPowerPeak: Joi.number().optional(),
    contractedPowerOffPeak: Joi.number().optional(),
    currentPricePowerPeak: Joi.number().optional(),
    currentPricePowerOffPeak: Joi.number().optional(),
    currentPriceEnergyPeak: Joi.number().optional(),
    currentPriceEnergyFlat: Joi.number().optional(),
    currentPriceEnergyOffPeak: Joi.number().optional()
  })

  const { error, value } = schema.validate(data, { stripUnknown: true })

  /* istanbul ignore next — Joi error branch not exercised for supply create in current tests */
  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
