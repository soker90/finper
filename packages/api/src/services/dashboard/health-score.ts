import { roundNumber } from '../../utils/roundNumber'
import type { HealthScore } from './dashboard.types'

/**
 * Computes the financial health score from 5 weighted sub-scores.
 *
 * Weights: savingsRate 25%, debtRatio 20%, budgetAdherence 20%,
 *          cashRunway 20%, pensionReturn 15%.
 */
export const computeHealthScore = (
  savingsRate: number,        // e.g. 15 → 15%
  totalDebts: number,         // absolute monetary value
  totalBalance: number,       // absolute monetary value
  budgetAdherencePct: number, // 0–100
  cashRunwayMonths: number,   // number of months
  pensionReturnPct: number    // e.g. 4.5 → 4.5%
): HealthScore => {
  const clamp = (v: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, v))

  const savingsScore = roundNumber(clamp(savingsRate / 20, 0, 1) * 100)
  const debtScore = roundNumber(Math.max(0, 1 - (totalBalance > 0 ? totalDebts / totalBalance : 1)) * 100)
  const budgetScore = roundNumber(Math.min(budgetAdherencePct, 100))
  const runwayScore = roundNumber(Math.min(cashRunwayMonths / 6, 1) * 100)
  const pensionScore = roundNumber(clamp(pensionReturnPct / 5, 0, 1) * 100)

  const total = roundNumber(
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
    return roundNumber(Math.max(0, (1 - (realExpenses - totalBudgetAmount) / totalBudgetAmount)) * 100)
  }
  if (prevExpenses > 0) {
    return roundNumber(Math.max(0, (1 - (realExpenses - prevExpenses) / prevExpenses)) * 100)
  }
  return realExpenses === 0 ? 100 : 50
}
