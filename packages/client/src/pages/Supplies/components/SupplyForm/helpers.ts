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
  name: isOther ? data.name : undefined,
  contractedPowerPeak: isElectricity ? data.contractedPowerPeak : undefined,
  contractedPowerOffPeak: isElectricity ? data.contractedPowerOffPeak : undefined,
  currentPricePowerPeak: isElectricity ? data.currentPricePowerPeak : undefined,
  currentPricePowerOffPeak: isElectricity ? data.currentPricePowerOffPeak : undefined,
  currentPriceEnergyPeak: isElectricity ? data.currentPriceEnergyPeak : undefined,
  currentPriceEnergyFlat: isElectricity ? data.currentPriceEnergyFlat : undefined,
  currentPriceEnergyOffPeak: isElectricity ? data.currentPriceEnergyOffPeak : undefined
})
