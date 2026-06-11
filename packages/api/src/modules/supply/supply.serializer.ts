import { schema } from '@soker90/finper-db'
type Supply = typeof schema.supplies.$inferSelect

export const serializeSupply = (s: Supply) => ({
  _id: s.id,
  name: s.name,
  type: s.type,
  propertyId: s.propertyId,
  contractedPowerPeak: s.contractedPowerPeak,
  contractedPowerOffPeak: s.contractedPowerOffPeak,
  currentPricePowerPeak: s.currentPricePowerPeak,
  currentPricePowerOffPeak: s.currentPricePowerOffPeak,
  currentPriceEnergyPeak: s.currentPriceEnergyPeak,
  currentPriceEnergyFlat: s.currentPriceEnergyFlat,
  currentPriceEnergyOffPeak: s.currentPriceEnergyOffPeak,
  user: s.user
})
