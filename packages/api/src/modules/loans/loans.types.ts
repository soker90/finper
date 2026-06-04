export interface LoanStats {
  paidPrincipal: number
  paidInterest: number
  pendingPrincipal: number
  estimatedPendingInterest: number
  totalCostToDate: number
  estimatedTotalCost: number
  ordinaryPaymentsCount: number
  extraordinaryPaymentsCount: number
  totalOrdinaryAmount: number
  totalExtraordinaryAmount: number
  savedByExtraordinary: number
  estimatedEndDate: number | null
  currentPayment: number
  currentRate: number
}

export interface SimulationOption {
  newMonthsLeft: number
  newMonthlyPayment: number
  monthsSaved: number
  monthlySaving: number
  totalInterestSaved: number
  newEndDate: number | null
}

export interface SimulationResult {
  lumpSum: number
  originalMonthsLeft: number
  originalMonthlyPayment: number
  originalEndDate: number | null
  optionA: SimulationOption
  optionB: SimulationOption
}
