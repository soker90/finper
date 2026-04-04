import { LoanPaymentType } from '@soker90/finper-shared'

export { LoanPaymentType }

export interface Loan {
  _id: string
  name: string
  initialAmount: number
  pendingAmount: number
  interestRate: number
  startDate: number
  monthlyPayment: number
  account: string
  category: string
}

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

export interface AmortizationRow {
  _id?: string
  period: number
  date: number
  amount: number
  interest: number
  principal: number
  accumulatedPrincipal: number
  pendingCapital: number
  type: LoanPaymentType
  isProjected: boolean
}

export interface LoanDetail extends Loan {
  stats: LoanStats
  amortizationTable: AmortizationRow[]
}
