import { computeHealthScore } from '../../src/services/dashboard.service'

describe('computeHealthScore', () => {
  test('all perfect inputs should yield a total near 100', () => {
    // savingsRate >= 20% → savingsScore 100
    // totalDebts = 0 → debtScore 100
    // budgetAdherencePct = 100 → budgetScore 100
    // cashRunwayMonths >= 6 → runwayScore 100
    // pensionReturnPct >= 5% → pensionScore 100
    const result = computeHealthScore(20, 0, 10000, 100, 6, 5)
    expect(result.total).toBe(100)
    expect(result.savingsRate).toBe(100)
    expect(result.debtRatio).toBe(100)
    expect(result.budgetAdherence).toBe(100)
    expect(result.cashRunway).toBe(100)
    expect(result.pensionReturn).toBe(100)
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

  test('savingsRate sub-score scales linearly up to 20%', () => {
    const at10 = computeHealthScore(10, 0, 0, 0, 0, 0)
    expect(at10.savingsRate).toBe(50)

    const at20 = computeHealthScore(20, 0, 0, 0, 0, 0)
    expect(at20.savingsRate).toBe(100)

    // Capped at 100 even above 20
    const at40 = computeHealthScore(40, 0, 0, 0, 0, 0)
    expect(at40.savingsRate).toBe(100)
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
    // Concrete case: savingsScore=80, debtScore=60, budgetScore=70, runwayScore=50, pensionScore=40
    // savingsRate = 16% → 16/20 * 100 = 80
    // debts = 2000, balance = 5000 → (1 - 2000/5000) * 100 = 60
    // budgetAdherence = 70
    // cashRunway = 3 months → 3/6 * 100 = 50
    // pensionReturn = 2% → 2/5 * 100 = 40
    // total = round(80*0.25 + 60*0.20 + 70*0.20 + 50*0.20 + 40*0.15)
    //       = round(20 + 12 + 14 + 10 + 6) = round(62) = 62
    const result = computeHealthScore(16, 2000, 5000, 70, 3, 2)
    expect(result.savingsRate).toBe(80)
    expect(result.debtRatio).toBe(60)
    expect(result.budgetAdherence).toBe(70)
    expect(result.cashRunway).toBe(50)
    expect(result.pensionReturn).toBe(40)
    expect(result.total).toBe(62)
  })

  test('all sub-scores are integers (Math.round applied)', () => {
    const result = computeHealthScore(7, 1234, 5678, 67, 2.5, 1.7)
    expect(Number.isInteger(result.total)).toBe(true)
    expect(Number.isInteger(result.savingsRate)).toBe(true)
    expect(Number.isInteger(result.debtRatio)).toBe(true)
    expect(Number.isInteger(result.budgetAdherence)).toBe(true)
    expect(Number.isInteger(result.cashRunway)).toBe(true)
    expect(Number.isInteger(result.pensionReturn)).toBe(true)
  })
})
