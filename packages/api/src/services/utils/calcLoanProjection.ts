import { ILoanPayment, LoanPaymentType, LOAN_PAYMENT, Types } from '@soker90/finper-models'
import { roundNumber } from '../../utils/roundNumber'

/**
 * Safety cap: maximum number of projected periods (50 years).
 * When the monthly payment does not cover the interest, the principal never
 * decreases and the loop would run forever — this constant prevents that.
 * In that scenario the projected table will contain exactly MAX_PERIODS rows,
 * all with pendingCapital >= the original pendingAmount.
 */
const MAX_PERIODS = 600

/**
 * Threshold below which the pending capital is considered fully amortised
 * (less than 1 cent, accounting for floating-point rounding).
 */
const AMORTIZATION_THRESHOLD = 0.009

interface ProjectedPayment extends Omit<ILoanPayment, 'loan' | 'user'> {
  type: LoanPaymentType
  period: number
}

export interface LoanEventInput {
  date: number
  newRate: number
  newPayment: number
}

interface ProjectionInput {
  pendingAmount: number
  interestRate: number
  monthlyPayment: number
  /** Date of the last ordinary payment (or startDate - 1 month if none) */
  lastOrdinaryPaymentDate: number
  events: LoanEventInput[]
  startPeriod: number
}

/**
 * Calculates monthly interest rate from annual TIN
 */
const monthlyRate = (annualRate: number): number => annualRate / 100 / 12

/**
 * French amortization formula: monthly payment for remaining capital
 * C = P * r(1+r)^n / ((1+r)^n - 1)
 */
export const calcMonthlyPayment = (principal: number, annualRate: number, months: number): number => {
  const monthlyInterestRate = monthlyRate(annualRate)
  if (monthlyInterestRate === 0) return roundNumber(principal / months)
  return roundNumber(principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months)) / (Math.pow(1 + monthlyInterestRate, months) - 1))
}

/**
 * Calculates remaining months given principal, rate and monthly payment
 */
export const calcRemainingMonths = (principal: number, annualRate: number, payment: number): number => {
  const monthlyInterestRate = monthlyRate(annualRate)
  if (monthlyInterestRate === 0) return Math.ceil(principal / payment)
  if (payment <= principal * monthlyInterestRate) return Infinity // payment does not cover interest
  return Math.ceil(-Math.log(1 - (principal * monthlyInterestRate) / payment) / Math.log(1 + monthlyInterestRate))
}

/**
 * Subtracts one month from a timestamp, keeping the same day of month
 */
const subtractOneMonth = (timestamp: number): number => {
  const currentDate = new Date(timestamp)
  const dayOfMonth = currentDate.getDate()
  currentDate.setMonth(currentDate.getMonth() - 1)
  /* istanbul ignore next — only triggers when subtracting a month crosses month-end boundary (e.g. Mar 31 → Feb 28) */
  if (currentDate.getDate() !== dayOfMonth) {
    currentDate.setDate(0)
  }
  return currentDate.getTime()
}

/**
 * Adds one month to a timestamp, keeping the same day of month
 */
const addOneMonth = (timestamp: number): number => {
  const currentDate = new Date(timestamp)
  const dayOfMonth = currentDate.getDate()
  currentDate.setMonth(currentDate.getMonth() + 1)
  // Handle months with fewer days (e.g. Jan 31 + 1 month = Feb 28)
  /* istanbul ignore next — only triggers when adding a month crosses month-end boundary (e.g. Jan 31 → Feb 28) */
  if (currentDate.getDate() !== dayOfMonth) {
    currentDate.setDate(0) // last day of previous month
  }
  return currentDate.getTime()
}

/**
 * Projects future ordinary payments using the French amortization system.
 * Dates are anchored to the last ordinary payment date so that extraordinary
 * payments do not shift the schedule.
 * Returns an array of projected (not-yet-paid) rows.
 */
const projectLoanPayments = (input: ProjectionInput): ProjectedPayment[] => {
  const { startPeriod, events } = input
  let pending = roundNumber(input.pendingAmount)
  let rate = input.interestRate
  let payment = input.monthlyPayment
  // Anchor dates to the last ORDINARY payment — extraordinary payments don't shift the schedule
  let lastDate = input.lastOrdinaryPaymentDate
  let period = startPeriod

  // Sort events ascending by date, filter only future events
  const futureEvents = events
    .filter(event => event.date >= lastDate)
    .toSorted((eventA, eventB) => eventA.date - eventB.date)

  const projected: ProjectedPayment[] = []
  let eventIdx = 0

  while (pending > AMORTIZATION_THRESHOLD && period < startPeriod + MAX_PERIODS) {
    const nextDate = addOneMonth(lastDate)

    // Apply any event that takes effect before or on this payment date
    while (eventIdx < futureEvents.length && futureEvents[eventIdx].date <= nextDate) {
      rate = futureEvents[eventIdx].newRate
      payment = futureEvents[eventIdx].newPayment
      eventIdx++
    }

    const monthlyInterestRate = monthlyRate(rate)
    const interestPart = roundNumber(pending * monthlyInterestRate)
    const principalPart = roundNumber(Math.min(payment - interestPart, pending))
    const totalAmount = roundNumber(interestPart + principalPart)
    pending = roundNumber(pending - principalPart)

    projected.push({
      period,
      date: nextDate,
      amount: totalAmount,
      interest: interestPart,
      principal: principalPart,
      accumulatedPrincipal: 0, // filled by caller if needed
      pendingCapital: pending,
      type: LOAN_PAYMENT.ORDINARY
    })

    lastDate = nextDate
    period++
  }

  return projected
}

/**
 * Builds the complete amortization table merging real payments and projections.
 * Real payments are returned as-is; projections are calculated from current state.
 * Dates are anchored to the last ordinary payment so that extraordinary payments
 * do not shift the schedule.
 */
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

export const buildAmortizationTable = (
  realPayments: (ILoanPayment & { _id?: string | Types.ObjectId })[],
  pendingAmount: number,
  interestRate: number,
  monthlyPayment: number,
  events: LoanEventInput[],
  startDate: number,
  projectionStartDate?: number
): AmortizationRow[] => {
  const sorted = realPayments.toSorted((paymentA, paymentB) => paymentA.date - paymentB.date)

  const real: AmortizationRow[] = sorted.map((payment, index) => ({
    _id: payment._id?.toString(),
    period: index + 1,
    date: payment.date,
    amount: payment.amount,
    interest: payment.interest,
    principal: payment.principal,
    accumulatedPrincipal: payment.accumulatedPrincipal,
    pendingCapital: payment.pendingCapital,
    type: payment.type,
    isProjected: false
  }))

  // Anchor projection to the last ORDINARY real payment date.
  // Extraordinary payments must not shift the schedule.
  const lastOrdinaryReal = [...sorted]
    .reverse()
    .find(payment => payment.type === LOAN_PAYMENT.ORDINARY)

  const lastOrdinaryDate = lastOrdinaryReal?.date ?? projectionStartDate ?? subtractOneMonth(startDate)
  const nextProjectedDate = addOneMonth(lastOrdinaryDate)
  const startPeriod = real.length + 1

  // Tasa vigente en el momento de la proyección (último evento cuya fecha ≤ nextProjectedDate)
  const sortedEvents = events.toSorted((eventA, eventB) => eventA.date - eventB.date)
  const lastEvent = sortedEvents.findLast(event => event.date <= nextProjectedDate)
  const currentRate = lastEvent?.newRate ?? interestRate
  const currentPayment = lastEvent?.newPayment ?? monthlyPayment

  const projectedRaw = projectLoanPayments({
    pendingAmount,
    interestRate: currentRate,
    monthlyPayment: currentPayment,
    lastOrdinaryPaymentDate: lastOrdinaryDate,
    events,
    startPeriod
  })

  // Calculate accumulated principal for projected rows
  let accumulatedPrincipal = real[real.length - 1]?.accumulatedPrincipal ?? 0
  const projected: AmortizationRow[] = projectedRaw.map(projectedPayment => {
    accumulatedPrincipal = roundNumber(accumulatedPrincipal + projectedPayment.principal)
    return {
      period: projectedPayment.period,
      date: projectedPayment.date,
      amount: projectedPayment.amount,
      interest: projectedPayment.interest,
      principal: projectedPayment.principal,
      accumulatedPrincipal,
      pendingCapital: projectedPayment.pendingCapital,
      type: projectedPayment.type,
      isProjected: true
    }
  })

  return [...real, ...projected]
}
