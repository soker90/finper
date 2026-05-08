export interface FireProjectionParams {
  currentBalance: number
  monthlyContribution?: number
  annualReturnRate?: number
  withdrawalRate?: number
  annualExpenses: number
  totalDebts?: number
  totalLoansPending?: number
  totalReceivable?: number
}

export interface ProjectionPoint {
  year: number
  netWorth: number
  contributions: number
  interest: number
  fireTarget: number
  isFireReached: boolean
}

export interface FireProjectionResult {
  netWorth: number
  fireTarget: number
  yearsToFire: number | null
  projectionPoints: ProjectionPoint[]
}
