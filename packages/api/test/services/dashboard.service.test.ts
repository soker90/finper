import { computeHealthScore, computeSavingsScore, computeHistoricalSavingsRate } from '../../src/services/dashboard/health-score'

describe('computeSavingsScore', () => {
  test('rate <= 0 returns 0', () => {
    expect(computeSavingsScore(0)).toBe(0)
    expect(computeSavingsScore(-5)).toBe(0)
    expect(computeSavingsScore(-100)).toBe(0)
  })

  test('rate in 0–5% range maps to 0–30 pts', () => {
    // 0% → 0, 5% → 30
    expect(computeSavingsScore(0)).toBe(0)
    expect(computeSavingsScore(2.5)).toBe(15)
    expect(computeSavingsScore(5)).toBe(30)
  })

  test('rate in 5–15% range maps to 30–70 pts', () => {
    // 5% → 30, 10% → 50, 15% → 70
    expect(computeSavingsScore(5)).toBe(30)
    expect(computeSavingsScore(10)).toBe(50)
    expect(computeSavingsScore(15)).toBe(70)
  })

  test('rate in 15–30% range maps to 70–100 pts', () => {
    // 15% → 70, 22.5% → 85, 30% → 100
    expect(computeSavingsScore(15)).toBe(70)
    expect(computeSavingsScore(22.5)).toBe(85)
    expect(computeSavingsScore(30)).toBe(100)
  })

  test('rate above 30% is capped at 100', () => {
    expect(computeSavingsScore(40)).toBe(100)
    expect(computeSavingsScore(100)).toBe(100)
  })
})

describe('computeHistoricalSavingsRate', () => {
  const currentMonth = 4  // May (0-indexed)
  const currentYear = 2026

  test('returns fallback when no months with income are available', () => {
    expect(computeHistoricalSavingsRate([], currentMonth, currentYear, 15)).toBe(15)
  })

  test('excludes the current in-progress month', () => {
    const months = [
      { month: 5, year: 2026, income: 2000, expenses: 1000 }, // current → excluded
      { month: 4, year: 2026, income: 2000, expenses: 1200 }, // April → 40%
    ]
    // Only April qualifies: (2000-1200)/2000 * 100 = 40%
    expect(computeHistoricalSavingsRate(months, currentMonth, currentYear, 0)).toBe(40)
  })

  test('excludes months with no income', () => {
    const months = [
      { month: 3, year: 2026, income: 0, expenses: 500 },    // no income → excluded
      { month: 2, year: 2026, income: 2000, expenses: 1600 }, // 20%
      { month: 1, year: 2026, income: 2000, expenses: 1800 }, // 10%
    ]
    // avg of 20% and 10% = 15%
    expect(computeHistoricalSavingsRate(months, currentMonth, currentYear, 0)).toBe(15)
  })

  test('uses only the last 3 completed months', () => {
    const months = [
      { month: 11, year: 2025, income: 2000, expenses: 1000 }, // 50% — oldest, excluded (4th)
      { month: 12, year: 2025, income: 2000, expenses: 1200 }, // 40%
      { month: 1, year: 2026, income: 2000, expenses: 1400 },  // 30%
      { month: 2, year: 2026, income: 2000, expenses: 1600 },  // 20%
    ]
    // avg of last 3: (40 + 30 + 20) / 3 ≈ 30
    expect(computeHistoricalSavingsRate(months, currentMonth, currentYear, 0)).toBe(30)
  })

  test('returns fallback when all months are zero income', () => {
    const months = [
      { month: 2, year: 2026, income: 0, expenses: 500 },
      { month: 1, year: 2026, income: 0, expenses: 300 },
    ]
    expect(computeHistoricalSavingsRate(months, currentMonth, currentYear, 25)).toBe(25)
  })
})

describe('computeHealthScore', () => {
  test('all perfect inputs should yield a total of 95', () => {
    // savingsRate >= 30% → savingsScore 100, but rate=20% → savingsScore 80
    // totalDebts = 0 → debtScore 100
    // budgetAdherencePct = 100 → budgetScore 100
    // cashRunwayMonths >= 6 → runwayScore 100
    // pensionReturnPct >= 5% → pensionScore 100
    // total = round(80*0.25 + 100*0.20 + 100*0.20 + 100*0.20 + 100*0.15) = round(20+20+20+20+15) = 95
    const result = computeHealthScore(20, 0, 10000, 100, 6, 5)
    expect(result.total).toBe(95)
    expect(result.savingsRate).toBe(80)
    expect(result.debtRatio).toBe(100)
    expect(result.budgetAdherence).toBe(100)
    expect(result.cashRunway).toBe(100)
    expect(result.pensionReturn).toBe(100)
  })

  test('savingsRate >= 30% yields a perfect total of 100', () => {
    const result = computeHealthScore(30, 0, 10000, 100, 6, 5)
    expect(result.savingsRate).toBe(100)
    expect(result.total).toBe(100)
  })

  test('all zero inputs should yield a total of 0', () => {
    const result = computeHealthScore(0, 0, 0, 0, 0, 0)
    expect(result.total).toBe(0)
    expect(result.savingsRate).toBe(0)
    // debtRatio: totalBalance=0 → treated as 0 debt ratio → score 0
    expect(result.debtRatio).toBe(0)
    expect(result.budgetAdherence).toBe(0)
    expect(result.cashRunway).toBe(0)
    expect(result.pensionReturn).toBe(0)
  })

  test('savingsRate sub-score uses progressive scale', () => {
    // 10% → 30 + ((10-5)/10)*40 = 50
    const at10 = computeHealthScore(10, 0, 0, 0, 0, 0)
    expect(at10.savingsRate).toBe(50)

    // 20% → 70 + ((20-15)/15)*30 = 70+10 = 80
    const at20 = computeHealthScore(20, 0, 0, 0, 0, 0)
    expect(at20.savingsRate).toBe(80)

    // Capped at 100 above 30%
    const at40 = computeHealthScore(40, 0, 0, 0, 0, 0)
    expect(at40.savingsRate).toBe(100)
  })

  test('negative savingsRate yields savingsScore of 0', () => {
    const result = computeHealthScore(-10, 0, 10000, 0, 0, 0)
    expect(result.savingsRate).toBe(0)
  })

  test('debtRatio sub-score is 100 when no debts and positive balance', () => {
    const result = computeHealthScore(0, 0, 5000, 0, 0, 0)
    expect(result.debtRatio).toBe(100)
  })

  test('debtRatio sub-score is 50 when debts equal half the balance', () => {
    // debtScore = (1 - 2500/5000) * 100 = 50
    const result = computeHealthScore(0, 2500, 5000, 0, 0, 0)
    expect(result.debtRatio).toBe(50)
  })

  test('debtRatio sub-score is 0 when debts exceed balance', () => {
    // debtScore = max(0, 1 - 6000/5000) → max(0, -0.2) = 0
    const result = computeHealthScore(0, 6000, 5000, 0, 0, 0)
    expect(result.debtRatio).toBe(0)
  })

  test('cashRunway sub-score scales up to 6 months', () => {
    const at3 = computeHealthScore(0, 0, 0, 0, 3, 0)
    expect(at3.cashRunway).toBe(50)

    const at6 = computeHealthScore(0, 0, 0, 0, 6, 0)
    expect(at6.cashRunway).toBe(100)

    // Capped at 100
    const at12 = computeHealthScore(0, 0, 0, 0, 12, 0)
    expect(at12.cashRunway).toBe(100)
  })

  test('pensionReturn sub-score scales up to 5%', () => {
    const atHalf = computeHealthScore(0, 0, 0, 0, 0, 2.5)
    expect(atHalf.pensionReturn).toBe(50)

    const at5 = computeHealthScore(0, 0, 0, 0, 0, 5)
    expect(at5.pensionReturn).toBe(100)

    // Capped
    const at10 = computeHealthScore(0, 0, 0, 0, 0, 10)
    expect(at10.pensionReturn).toBe(100)
  })

  test('total is weighted sum of sub-scores (25/20/20/20/15)', () => {
    // savingsRate=16% → 70 + ((16-15)/15)*30 = 70+2 = 72
    // debts=2000, balance=5000 → (1-2000/5000)*100 = 60
    // budgetAdherence=70
    // cashRunway=3 → 3/6*100 = 50
    // pensionReturn=2% → 2/5*100 = 40
    // total = round(72*0.25 + 60*0.20 + 70*0.20 + 50*0.20 + 40*0.15)
    //       = round(18 + 12 + 14 + 10 + 6) = round(60) = 60
    const result = computeHealthScore(16, 2000, 5000, 70, 3, 2)
    expect(result.savingsRate).toBe(72)
    expect(result.debtRatio).toBe(60)
    expect(result.budgetAdherence).toBe(70)
    expect(result.cashRunway).toBe(50)
    expect(result.pensionReturn).toBe(40)
    expect(result.total).toBe(60)
  })

  test('all sub-scores are rounded to integers (Math.round applied)', () => {
    // savingsRate=7% → 30 + ((7-5)/10)*40 = 30+8 = 38
    // debts=1234, balance=5678 → (1-1234/5678)*100 ≈ 78
    // budgetAdherence=67
    // cashRunway=2.5 → 2.5/6*100 ≈ 42
    // pensionReturn=1.7% → 1.7/5*100 = 34
    // total = round(38*0.25 + 78*0.20 + 67*0.20 + 42*0.20 + 34*0.15)
    //       = round(9.5 + 15.6 + 13.4 + 8.4 + 5.1) = round(52) = 52
    const result = computeHealthScore(7, 1234, 5678, 67, 2.5, 1.7)
    expect(result.total).toBe(52)
    expect(result.savingsRate).toBe(38)
    expect(result.debtRatio).toBe(78)
    expect(result.budgetAdherence).toBe(67)
    expect(result.cashRunway).toBe(42)
    expect(result.pensionReturn).toBe(34)
    expect(Number.isInteger(result.total)).toBe(true)
    expect(Number.isInteger(result.savingsRate)).toBe(true)
    expect(Number.isInteger(result.debtRatio)).toBe(true)
    expect(Number.isInteger(result.cashRunway)).toBe(true)
  })
})
