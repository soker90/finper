import { roundNumber } from '../../utils/roundNumber'
import type { HealthScore, MonthlyData } from './dashboard.types'

/**
 * Computes the savings score using a progressive scale:
 * - 0–5%:   0–30 pts  (danger zone)
 * - 5–15%:  30–70 pts (healthy zone)
 * - 15–30%: 70–100 pts (excellent zone)
 * - >30%:   100 pts
 * - <=0%:   0 pts (no savings or negative rate)
 */
export const computeSavingsScore = (rate: number): number => {
  if (rate <= 0 || Number.isNaN(rate)) return 0
  if (rate < 5) return Math.round((rate / 5) * 30)
  if (rate < 15) return Math.round(30 + ((rate - 5) / 10) * 40)
  if (rate < 30) return Math.round(70 + ((rate - 15) / 15) * 30)
  return 100
}

interface ComputeHistoricalSavingsRateParams {
  last6Months: MonthlyData[]
  currentMonthIndex: number  // 0-indexed month of "now" (0 = Jan, 11 = Dec)
  currentYear: number
  fallback: number
}

/**
 * Computes the historical savings rate as the arithmetic mean of the savings rate
 * of the last completed months (up to 3). Months with no income are excluded.
 * Falls back to the current month's savings rate when no historical data is available.
 */
export const computeHistoricalSavingsRate = ({
  last6Months,
  currentMonthIndex,
  currentYear,
  fallback
}: ComputeHistoricalSavingsRateParams): number => {
  const completedMonths = last6Months.filter(monthData => {
    // Only include strictly past months to avoid distortion from future-dated transactions
    const isPastMonth = monthData.year < currentYear ||
      (monthData.year === currentYear && monthData.month < currentMonthIndex + 1)
    return isPastMonth && monthData.income > 0
  })

  const recentMonths = completedMonths.slice(-3)
  if (recentMonths.length === 0) return fallback

  const totalRate = recentMonths.reduce((sum, monthData) => {
    const monthRate = ((monthData.income - monthData.expenses) / monthData.income) * 100
    return sum + monthRate
  }, 0)

  return roundNumber(totalRate / recentMonths.length)
}

/**
 * Computes the financial health score from 5 weighted sub-scores.
 *
 * Weights: savingsRate 25%, debtRatio 20%, budgetAdherence 20%,
 *          cashRunway 20%, pensionReturn 15%.
 *
 * savingsRate should be the historical rate (avg of last 3 completed months)
 * to avoid distortion from the in-progress current month.
 */
export const computeHealthScore = (
  savingsRate: number,        // historical avg savings rate (last 3 completed months)
  totalDebts: number,         // absolute monetary value
  totalBalance: number,       // absolute monetary value
  budgetAdherencePct: number, // 0–100
  cashRunwayMonths: number,   // number of months
  pensionReturnPct: number    // e.g. 4.5 → 4.5%
): HealthScore => {
  const clamp = (v: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, v))

  const savingsScore = computeSavingsScore(savingsRate)
  const debtScore = Math.round(Math.max(0, 1 - (totalBalance > 0 ? totalDebts / totalBalance : 1)) * 100)
  const budgetScore = Math.round(Math.min(budgetAdherencePct, 100))
  const runwayScore = Math.round(Math.min(cashRunwayMonths / 6, 1) * 100)
  const pensionScore = Math.round(clamp(pensionReturnPct / 5, 0, 1) * 100)

  const total = Math.round(
    savingsScore * 0.25 +
    debtScore * 0.20 +
    budgetScore * 0.20 +
    runwayScore * 0.20 +
    pensionScore * 0.15
  )

  return {
    total,
    savingsRate: savingsScore,
    debtRatio: debtScore,
    budgetAdherence: budgetScore,
    cashRunway: runwayScore,
    pensionReturn: pensionScore
  }
}

/**
 * Computes the budget adherence percentage (0–100+).
 * - When actual budgets are configured, measures real expenses against the total budget.
 * - Falls back to comparing real expenses against the previous month when no budgets exist.
 * - Returns 100 when there is no reference data and no expenses.
 * - Returns 50 as a neutral default when there is no reference data but there are expenses.
 */
export const computeBudgetAdherence = (
  realExpenses: number,
  totalBudgetAmount: number,
  prevExpenses: number
): number => {
  if (totalBudgetAmount > 0) {
    return Math.round(Math.max(0, (1 - (realExpenses - totalBudgetAmount) / totalBudgetAmount)) * 100)
  }
  if (prevExpenses > 0) {
    return Math.round(Math.max(0, (1 - (realExpenses - prevExpenses) / prevExpenses)) * 100)
  }
  return realExpenses === 0 ? 100 : 50
}
