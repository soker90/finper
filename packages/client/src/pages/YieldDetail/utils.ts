import { YieldSettlement } from 'types'

// A settlement without settlementDate is still pending (no income confirmed
// yet) and doesn't belong to a closed year: attributing it to the current
// calendar year would distort past years' historical totals as time passes.
export const getSettlementYear = (settlement: Pick<YieldSettlement, 'settlementDate'>): number | null =>
  settlement.settlementDate ? new Date(settlement.settlementDate).getFullYear() : null
