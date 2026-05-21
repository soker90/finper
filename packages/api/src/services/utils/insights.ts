import { roundNumber } from '../../utils/roundNumber'

export interface Insight {
  type: 'warning' | 'info' | 'success' | 'critical'
  title: string
  message: string
}

export interface CategorySpendingRow {
  categoryId: string
  name: string
  total: number
  count: number
}

export interface CategoryHistoryRow {
  categoryId: string
  name: string
  avgMonthly: number
}

export interface BudgetRow {
  categoryId: string
  name: string
  amount: number
}

export interface MonthlyData {
  month: number   // 1-indexed
  year: number
  income: number
  expenses: number
}

export interface InsightParams {
  currentMonthByCategory: CategorySpendingRow[]
  last3MonthsByCategory: CategoryHistoryRow[]
  budgets: BudgetRow[]
  dayOfMonth: number
  daysInMonth: number
  last6Months: MonthlyData[]
}

const ANOMALY_THRESHOLD = 0.25   // 25% above historical average → anomaly
const SAVINGS_RATE_TARGET = 20   // minimum savings rate (%) to count as a good month
const STREAK_THRESHOLD = 3       // consecutive qualifying months to trigger streak insight

/**
 * Rule 1 — Spending anomaly detection.
 * Fires a warning when the current month's spending in a category exceeds
 * the 3-month historical average by more than ANOMALY_THRESHOLD.
 */
export const detectSpendingAnomalies = (
  current: CategorySpendingRow[],
  historical: CategoryHistoryRow[]
): Insight[] => {
  const historicalMap = new Map(
    historical.map(h => [h.categoryId.toString(), h])
  )

  return current.flatMap(cat => {
    const avg = historicalMap.get(cat.categoryId.toString())
    if (!avg || avg.avgMonthly <= 0) return []

    const pctIncrease = (cat.total - avg.avgMonthly) / avg.avgMonthly
    if (pctIncrease <= ANOMALY_THRESHOLD) return []

    return [{
      type: 'warning' as const,
      title: 'Gasto disparado',
      message: `🔴 Has gastado ${cat.total.toFixed(2)}€ en ${cat.name} este mes, un ${roundNumber(pctIncrease * 100)}% más que tu media habitual.`
    }]
  })
}

/**
 * Rule 2 — Budget velocity check.
 * Projects end-of-month spending based on the current daily burn rate and
 * fires a critical alert if the projection exceeds the configured budget.
 */
export const detectBudgetVelocity = ({
  currentMonthByCategory,
  budgets,
  dayOfMonth,
  daysInMonth
}: Pick<InsightParams, 'currentMonthByCategory' | 'budgets' | 'dayOfMonth' | 'daysInMonth'>): Insight[] => {
  if (dayOfMonth <= 0) return []

  const spentMap = new Map(
    currentMonthByCategory.map(c => [c.categoryId.toString(), c.total])
  )

  return budgets.flatMap(budget => {
    const spent = spentMap.get(budget.categoryId.toString()) ?? 0
    if (spent <= 0) return []

    const dailyRate = spent / dayOfMonth
    const projected = dailyRate * daysInMonth
    if (projected <= budget.amount) return []

    const remaining = budget.amount - spent
    const daysUntilExhausted = remaining > 0 && dailyRate > 0
      ? Math.floor(remaining / dailyRate)
      : 0
    const timeText = daysUntilExhausted > 0 ? `en ${daysUntilExhausted} días` : 'muy pronto'

    return [{
      type: 'critical' as const,
      title: 'Presupuesto en riesgo',
      message: `⚠️ A tu ritmo actual, agotarás tu presupuesto de ${budget.name} ${timeText}.`
    }]
  })
}

const calcMonthlySavingsRate = (m: MonthlyData): number =>
  m.income > 0 ? ((m.income - m.expenses) / m.income) * 100 : 0

/**
 * Rule 3 — Savings streak reinforcement.
 * Counts consecutive completed months (in descending order) where the savings rate
 * meets or exceeds SAVINGS_RATE_TARGET and fires a success insight when
 * the streak reaches STREAK_THRESHOLD.
 * Completed months are those strictly before the current month/year, making
 * this robust even when the current month has no transactions and is absent
 * from the data.
 */
export const detectSavingsStreak = (last6Months: MonthlyData[]): Insight[] => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1  // 1-indexed to match MonthlyData

  const completedMonths = last6Months.filter(
    m => m.year < currentYear || (m.year === currentYear && m.month < currentMonth)
  )

  let streak = 0
  for (let i = completedMonths.length - 1; i >= 0; i--) {
    if (calcMonthlySavingsRate(completedMonths[i]) >= SAVINGS_RATE_TARGET) streak++
    else break
  }

  if (streak < STREAK_THRESHOLD) return []

  return [{
    type: 'success' as const,
    title: '¡Racha de ahorro!',
    message: `✅ ¡Buen trabajo! Has mantenido tu Tasa de Ahorro por encima del ${SAVINGS_RATE_TARGET}% durante ${streak} meses seguidos.`
  }]
}

/**
 * Orchestrates all insight rules and returns a combined array.
 */
export const generateInsights = (params: InsightParams): Insight[] => [
  ...detectSpendingAnomalies(params.currentMonthByCategory, params.last3MonthsByCategory),
  ...detectBudgetVelocity(params),
  ...detectSavingsStreak(params.last6Months)
]
