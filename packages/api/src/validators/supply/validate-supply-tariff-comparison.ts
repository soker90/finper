import Boom from '@hapi/boom'
import { SupplyModel, SUPPLY_TYPE } from '@soker90/finper-models'
import { ERROR_MESSAGE } from '../../i18n'

export const validateSupplyForTariffComparison = async ({ id, user }: { id: string, user: string }) => {
  const supply = await SupplyModel.findOne({ _id: id, user })

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
