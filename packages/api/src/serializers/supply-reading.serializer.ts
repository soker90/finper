import { schema } from '@soker90/finper-db'
type Reading = typeof schema.supplyReadings.$inferSelect

// startDate/endDate son Date (timestamp_ms) → el API viejo los exponía como ms
export const serializeReading = (r: Reading) => ({
  _id: r.id,
  supplyId: r.supplyId,
  startDate: r.startDate.getTime(),
  endDate: r.endDate.getTime(),
  amount: r.amount,
  consumption: r.consumption,
  consumptionPeak: r.consumptionPeak,
  consumptionFlat: r.consumptionFlat,
  consumptionOffPeak: r.consumptionOffPeak,
  user: r.user
})
