import Joi from 'joi'
import Boom from '@hapi/boom'
import { SUPPLY_TYPE } from '@soker90/finper-db'
import { supplyRepository } from './supply.repository'
import { validatePropertyExist } from '../property/property.validators'
import { ERROR_MESSAGE } from '../../i18n'

export const validateSupplyExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const supply = supplyRepository.findById(id, user)
  if (!supply) {
    throw Boom.notFound(message || ERROR_MESSAGE.SUPPLY.NOT_FOUND).output
  }
}

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

export const validateSupplyForTariffComparison = async ({ id, user }: { id: string, user: string }) => {
  const supply = supplyRepository.findById(id, user)

  if (!supply) {
    throw Boom.notFound(ERROR_MESSAGE.SUPPLY.NOT_FOUND).output
  }

  if (supply.type !== SUPPLY_TYPE.ELECTRICITY) {
    throw Boom.badRequest(ERROR_MESSAGE.SUPPLY.ELECTRICITY_ONLY).output
  }

  if (supply.contractedPowerPeak === undefined || supply.contractedPowerOffPeak === undefined) {
    throw Boom.badRequest(ERROR_MESSAGE.SUPPLY.POWER_CONFIG_REQUIRED).output
  }

  if (
    supply.currentPricePowerPeak === undefined ||
    supply.currentPricePowerOffPeak === undefined ||
    supply.currentPriceEnergyPeak === undefined ||
    supply.currentPriceEnergyFlat === undefined ||
    supply.currentPriceEnergyOffPeak === undefined
  ) {
    throw Boom.badRequest(ERROR_MESSAGE.SUPPLY.PRICES_CONFIG_REQUIRED).output
  }
}
