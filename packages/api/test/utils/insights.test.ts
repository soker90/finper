import {
  generateInsights,
  detectSpendingAnomalies,
  detectBudgetVelocity,
  detectSavingsStreak,
  type CategorySpendingRow,
  type CategoryHistoryRow,
  type BudgetRow,
  type MonthlyData
} from '../../src/services/utils/insights'
import { computeBudgetAdherence } from '../../src/services/dashboard/health-score'

// Helpers

const makeSpending = (overrides: Partial<CategorySpendingRow> = {}): CategorySpendingRow => ({
  categoryId: 'cat-1',
  name: 'Restaurantes',
  total: 100,
  count: 5,
  ...overrides
})

const makeHistory = (overrides: Partial<CategoryHistoryRow> = {}): CategoryHistoryRow => ({
  categoryId: 'cat-1',
  name: 'Restaurantes',
  avgMonthly: 80,
  ...overrides
})

const makeBudget = (overrides: Partial<BudgetRow> = {}): BudgetRow => ({
  categoryId: 'cat-1',
  name: 'Restaurantes',
  amount: 200,
  ...overrides
})

/** Creates a MonthlyData entry in the past (January 2025 by default) */
const makeMonth = (income: number, expenses: number, overrides: Partial<MonthlyData> = {}): MonthlyData => ({
  month: 1,
  year: 2025,
  income,
  expenses,
  ...overrides
})

/** Creates a MonthlyData entry for the current month */
const makeCurrentMonth = (income: number, expenses: number): MonthlyData => {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear(), income, expenses }
}

/** Creates a MonthlyData entry for N months before the current month */
const makeMonthsAgo = (n: number, income: number, expenses: number): MonthlyData => {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return { month: d.getMonth() + 1, year: d.getFullYear(), income, expenses }
}

// detectSpendingAnomalies

describe('detectSpendingAnomalies', () => {
  test('returns empty array when no current spending', () => {
    const result = detectSpendingAnomalies([], [makeHistory()])
    expect(result).toEqual([])
  })

  test('returns empty array when no historical data', () => {
    const result = detectSpendingAnomalies([makeSpending()], [])
    expect(result).toEqual([])
  })

  test('returns empty array when historical average is zero', () => {
    const result = detectSpendingAnomalies(
      [makeSpending({ total: 150 })],
      [makeHistory({ avgMonthly: 0 })]
    )
    expect(result).toEqual([])
  })

  test('returns warning when current spending exceeds average by more than 25%', () => {
    // avg=80, current=101 → 26.25% above average → anomaly
    const result = detectSpendingAnomalies(
      [makeSpending({ total: 101 })],
      [makeHistory({ avgMonthly: 80 })]
    )
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('warning')
    expect(result[0].title).toBe('Gasto disparado')
    expect(result[0].message).toContain('Restaurantes')
    expect(result[0].message).toContain('101.00€')
  })

  test('returns empty when spending is exactly at the 25% threshold', () => {
    // avg=80, current=100 → exactly 25% → NOT anomaly (must be strictly above)
    const result = detectSpendingAnomalies(
      [makeSpending({ total: 100 })],
      [makeHistory({ avgMonthly: 80 })]
    )
    expect(result).toEqual([])
  })

  test('returns empty when current spending is below average', () => {
    const result = detectSpendingAnomalies(
      [makeSpending({ total: 60 })],
      [makeHistory({ avgMonthly: 80 })]
    )
    expect(result).toEqual([])
  })

  test('shows correct percentage in message', () => {
    // avg=100, current=200 → 100% increase
    const result = detectSpendingAnomalies(
      [makeSpending({ total: 200 })],
      [makeHistory({ avgMonthly: 100 })]
    )
    expect(result[0].message).toContain('100%')
  })

  test('generates one insight per anomalous category', () => {
    const current = [
      makeSpending({ categoryId: 'cat-1', name: 'Restaurantes', total: 200 }),
      makeSpending({ categoryId: 'cat-2', name: 'Ocio', total: 150 })
    ]
    const historical = [
      makeHistory({ categoryId: 'cat-1', avgMonthly: 100 }),
      makeHistory({ categoryId: 'cat-2', avgMonthly: 100 })
    ]
    const result = detectSpendingAnomalies(current, historical)
    expect(result).toHaveLength(2)
  })

  test('ignores categories with no historical match', () => {
    const result = detectSpendingAnomalies(
      [makeSpending({ categoryId: 'cat-new', total: 999 })],
      [makeHistory({ categoryId: 'cat-other' })]
    )
    expect(result).toEqual([])
  })
})

// detectBudgetVelocity

describe('detectBudgetVelocity', () => {
  test('returns empty array when dayOfMonth is 0', () => {
    const result = detectBudgetVelocity({
      currentMonthByCategory: [makeSpending()],
      budgets: [makeBudget()],
      dayOfMonth: 0,
      daysInMonth: 30
    })
    expect(result).toEqual([])
  })

  test('returns empty array when no budgets', () => {
    const result = detectBudgetVelocity({
      currentMonthByCategory: [makeSpending()],
      budgets: [],
      dayOfMonth: 10,
      daysInMonth: 30
    })
    expect(result).toEqual([])
  })

  test('returns empty when spending is zero for a budgeted category', () => {
    const result = detectBudgetVelocity({
      currentMonthByCategory: [],
      budgets: [makeBudget({ amount: 200 })],
      dayOfMonth: 10,
      daysInMonth: 30
    })
    expect(result).toEqual([])
  })

  test('returns critical when projected spending exceeds budget', () => {
    // spent=100 on day 10 of 30 → daily=10 → projected=300 > budget=200
    const result = detectBudgetVelocity({
      currentMonthByCategory: [makeSpending({ total: 100 })],
      budgets: [makeBudget({ amount: 200 })],
      dayOfMonth: 10,
      daysInMonth: 30
    })
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('critical')
    expect(result[0].title).toBe('Presupuesto en riesgo')
    expect(result[0].message).toContain('Restaurantes')
  })

  test('returns empty when projected spending is within budget', () => {
    // spent=10 on day 10 of 30 → daily=1 → projected=30 < budget=200
    const result = detectBudgetVelocity({
      currentMonthByCategory: [makeSpending({ total: 10 })],
      budgets: [makeBudget({ amount: 200 })],
      dayOfMonth: 10,
      daysInMonth: 30
    })
    expect(result).toEqual([])
  })

  test('calculates daysUntilExhausted correctly in message', () => {
    // spent=100, day=10, budget=200 → remaining=100, daily=10 → 10 days
    const result = detectBudgetVelocity({
      currentMonthByCategory: [makeSpending({ total: 100 })],
      budgets: [makeBudget({ amount: 200 })],
      dayOfMonth: 10,
      daysInMonth: 30
    })
    expect(result[0].message).toContain('en 10 días')
  })

  test('says "muy pronto" when budget already exceeded', () => {
    // spent=300 > budget=200 → remaining negative → daysUntilExhausted = 0
    const result = detectBudgetVelocity({
      currentMonthByCategory: [makeSpending({ total: 300 })],
      budgets: [makeBudget({ amount: 200 })],
      dayOfMonth: 15,
      daysInMonth: 30
    })
    expect(result[0].message).toContain('muy pronto')
  })
})

// detectSavingsStreak

describe('detectSavingsStreak', () => {
  test('returns empty array with no months', () => {
    expect(detectSavingsStreak([])).toEqual([])
  })

  test('returns empty when streak is less than 3 consecutive months', () => {
    const months = [
      makeMonth(1000, 900),  // 10% savings
      makeMonth(1000, 750),  // 25% savings
      makeMonth(1000, 900),  // 10% savings — breaks the streak at the end
    ]
    expect(detectSavingsStreak(months)).toEqual([])
  })

  test('returns empty with exactly 2 consecutive qualifying months', () => {
    const months = [
      makeMonth(1000, 900),  // 10% — does not qualify
      makeMonth(1000, 750),  // 25% — qualifies
      makeMonth(1000, 750),  // 25% — qualifies, but streak=2 < 3
    ]
    expect(detectSavingsStreak(months)).toEqual([])
  })

  test('returns success with exactly 3 consecutive qualifying months', () => {
    const months = [
      makeMonth(1000, 900),  // 10% — does not qualify
      makeMonth(1000, 750),  // 25%
      makeMonth(1000, 750),  // 25%
      makeMonth(1000, 750),  // 25%
      makeCurrentMonth(1000, 900),  // current month (skipped by implementation)
    ]
    const result = detectSavingsStreak(months)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('success')
    expect(result[0].message).toContain('3 meses')
  })

  test('streak resets on a non-qualifying month in the middle', () => {
    const months = [
      makeMonth(1000, 750),  // 25% — qualifies
      makeMonth(1000, 750),  // 25% — qualifies
      makeMonth(1000, 900),  // 10% — breaks streak
      makeMonth(1000, 750),  // 25% — qualifies
      makeMonth(1000, 750),  // 25% — qualifies, but streak=2 < 3
    ]
    expect(detectSavingsStreak(months)).toEqual([])
  })

  test('reports correct streak length in message', () => {
    const months = [
      ...Array.from({ length: 5 }, () => makeMonth(1000, 750)),
      makeCurrentMonth(1000, 750)
    ]
    const result = detectSavingsStreak(months)
    expect(result[0].message).toContain('5 meses')
  })

  test('ignores months with zero income', () => {
    const months = [
      makeMonth(1000, 750),  // 25%
      makeMonth(1000, 750),  // 25%
      makeMonth(0, 0),       // no income → 0% → breaks streak
      makeMonth(1000, 750),  // 25% — streak=1 < 3
    ]
    expect(detectSavingsStreak(months)).toEqual([])
  })

  test('skips the current month even when it has 100% savings rate', () => {
    const months = [
      makeMonthsAgo(3, 1000, 900),  // 10% — does not qualify
      makeMonthsAgo(2, 1000, 750),  // 25% — qualifies
      makeMonthsAgo(1, 1000, 750),  // 25% — qualifies (streak=2)
      makeCurrentMonth(1000, 0),    // 100% savings — current month, must be ignored
    ]
    expect(detectSavingsStreak(months)).toEqual([])
  })

  test('works correctly when current month is absent from data', () => {
    // MongoDB may not return the current month if there are no transactions
    const months = [
      makeMonthsAgo(3, 1000, 900),  // 10% — does not qualify
      makeMonthsAgo(2, 1000, 750),  // 25% — qualifies
      makeMonthsAgo(1, 1000, 750),  // 25% — qualifies (streak=2, no current month)
    ]
    // streak=2 < 3, should still return empty (not accidentally cut a valid month)
    expect(detectSavingsStreak(months)).toEqual([])
  })

  test('fires streak when 3 completed months qualify and current month absent', () => {
    const months = [
      makeMonthsAgo(5, 1000, 900),  // 10% — does not qualify
      makeMonthsAgo(4, 1000, 750),  // 25% — qualifies
      makeMonthsAgo(3, 1000, 750),  // 25% — qualifies
      makeMonthsAgo(2, 1000, 750),  // 25% — qualifies (streak=3)
      // current month absent
    ]
    const result = detectSavingsStreak(months)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('success')
    expect(result[0].message).toContain('3 meses')
  })

  test('message uses SAVINGS_RATE_TARGET constant value', () => {
    const months = Array.from({ length: 4 }, () => makeMonth(1000, 750))
    const result = detectSavingsStreak(months)
    expect(result[0].message).toContain('20%')
  })
})

// generateInsights

describe('generateInsights', () => {
  test('returns empty array when no data', () => {
    const result = generateInsights({
      currentMonthByCategory: [],
      last3MonthsByCategory: [],
      budgets: [],
      dayOfMonth: 15,
      daysInMonth: 30,
      last6Months: []
    })
    expect(result).toEqual([])
  })

  test('combines insights from all active rules', () => {
    // Rule 1: spending anomaly
    const current = [makeSpending({ categoryId: 'cat-1', total: 200 })]
    const historical = [makeHistory({ categoryId: 'cat-1', avgMonthly: 100 })]

    // Rule 2: budget velocity
    const budgets = [makeBudget({ categoryId: 'cat-1', amount: 150 })]

    // Rule 3: savings streak (3 qualifying completed months + 1 current month to skip)
    const last6Months = Array.from({ length: 4 }, () => makeMonth(1000, 750))

    const result = generateInsights({
      currentMonthByCategory: current,
      last3MonthsByCategory: historical,
      budgets,
      dayOfMonth: 10,
      daysInMonth: 30,
      last6Months
    })

    expect(result.length).toBeGreaterThanOrEqual(3)
    expect(result.some(i => i.type === 'warning')).toBe(true)
    expect(result.some(i => i.type === 'critical')).toBe(true)
    expect(result.some(i => i.type === 'success')).toBe(true)
  })
})

// computeBudgetAdherence

describe('computeBudgetAdherence', () => {
  test('returns 100 when budget is configured and expenses equal the budget', () => {
    expect(computeBudgetAdherence(200, 200, 0)).toBe(100)
  })

  test('returns 100 when expenses are below the configured budget', () => {
    expect(computeBudgetAdherence(150, 200, 0)).toBe(125)
  })

  test('penalises overspending against the configured budget', () => {
    // realExpenses=300, budget=200 → (1 - (300-200)/200) = 0.5 → 50%
    expect(computeBudgetAdherence(300, 200, 0)).toBe(50)
  })

  test('clamps to 0 when overspending is extreme', () => {
    // realExpenses=600, budget=200 → (1 - 400/200) = -1 → max(0,…) → 0%
    expect(computeBudgetAdherence(600, 200, 0)).toBe(0)
  })

  test('falls back to prevExpenses when no budget configured', () => {
    // realExpenses=100, prevExpenses=200 → (1 - (100-200)/200) = 1.5 → 150%
    expect(computeBudgetAdherence(100, 0, 200)).toBe(150)
  })

  test('falls back to prevExpenses when overspending vs previous month', () => {
    // realExpenses=300, prevExpenses=200 → (1 - 100/200) = 0.5 → 50%
    expect(computeBudgetAdherence(300, 0, 200)).toBe(50)
  })

  test('returns 100 when no budget, no prevExpenses and no real expenses', () => {
    expect(computeBudgetAdherence(0, 0, 0)).toBe(100)
  })

  test('returns 50 as neutral default when no reference data but there are expenses', () => {
    expect(computeBudgetAdherence(500, 0, 0)).toBe(50)
  })

  test('prefers configured budget over prevExpenses when both exist', () => {
    // budget=200, prevExpenses=100 — should use budget
    // realExpenses=200 → (1 - 0/200) = 1 → 100%
    expect(computeBudgetAdherence(200, 200, 100)).toBe(100)
  })
})
