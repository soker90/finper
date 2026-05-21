import { Supply, SupplyInput } from 'types'

export const getDefaultValues = (supply: Supply | undefined, propertyId: string): Partial<SupplyInput> => {
  if (!supply) return { propertyId }

  return {
    name: supply.name,
    type: supply.type,
    propertyId: supply.propertyId,
    contractedPowerPeak: supply.contractedPowerPeak,
    contractedPowerOffPeak: supply.contractedPowerOffPeak,
    currentPricePowerPeak: supply.currentPricePowerPeak,
    currentPricePowerOffPeak: supply.currentPricePowerOffPeak,
    currentPriceEnergyPeak: supply.currentPriceEnergyPeak,
    currentPriceEnergyFlat: supply.currentPriceEnergyFlat,
    currentPriceEnergyOffPeak: supply.currentPriceEnergyOffPeak
  }
}

export const buildSubmitPayload = (
  data: SupplyInput,
  isOther: boolean,
  isElectricity: boolean
): SupplyInput => ({
  ...data,
  ...(isOther && { name: data.name }),
  ...(isElectricity && {
    contractedPowerPeak: data.contractedPowerPeak,
    contractedPowerOffPeak: data.contractedPowerOffPeak,
    currentPricePowerPeak: data.currentPricePowerPeak,
    currentPricePowerOffPeak: data.currentPricePowerOffPeak,
    currentPriceEnergyPeak: data.currentPriceEnergyPeak,
    currentPriceEnergyFlat: data.currentPriceEnergyFlat,
    currentPriceEnergyOffPeak: data.currentPriceEnergyOffPeak
  })
})
