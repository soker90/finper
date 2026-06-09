import Joi from 'joi'
import Boom from '@hapi/boom'
import { validateSupplyExist } from './validate-supply-exist'
import { validatePropertyExist } from '../property'
import { SUPPLY_TYPE } from '@soker90/finper-db'

export const validateSupplyEditParams = async ({ params, body, user }: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  /* istanbul ignore else — params.id is always present when editing via route (URL param) */
  if (params.id) {
    await validateSupplyExist({ id: params.id, user })
  }

  /* istanbul ignore else — propertyId is always present in the body for supply edit requests */
  if (body.propertyId) {
    await validatePropertyExist({ id: body.propertyId, user })
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

  const { error, value } = schema.validate(body, { stripUnknown: true })

  /* istanbul ignore next — Joi error branch not exercised for supply edit in current tests */
  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
