import { roundNumber } from '../../src/utils/roundNumber'

describe('roundNumber', () => {
  test('integer stays unchanged', () => {
    expect(roundNumber(1)).toBe(1)
  })

  test('rounds down when third decimal is less than 5', () => {
    expect(roundNumber(1.004)).toBe(1)
  })

  test('rounds up when third decimal is exactly 5 (no IEEE 754 truncation)', () => {
    // With plain Math.round, 1.005 * 100 = 100.4999... → rounds to 100.
    // The EPSILON fix ensures it rounds up to 1.01 as expected.
    expect(roundNumber(1.005)).toBe(1.01)
  })

  test('rounds up for other x.xx5 cases', () => {
    expect(roundNumber(1.045)).toBe(1.05)
    expect(roundNumber(1.095)).toBe(1.1)
  })

  test('carry propagates to integer part', () => {
    expect(roundNumber(1.999)).toBe(2)
  })

  test('zero returns zero', () => {
    expect(roundNumber(0)).toBe(0)
  })

  test('typical financial value rounds correctly', () => {
    expect(roundNumber(100.126)).toBe(100.13)
  })

  test('negative x.xx5 rounds away from zero (symmetric)', () => {
    // -1.005 should round to -1.01, not -1.00
    expect(roundNumber(-1.005)).toBe(-1.01)
  })

  test('negative value with third decimal < 5 rounds toward zero', () => {
    expect(roundNumber(-1.004)).toBe(-1)
  })

  test('typical amortization interest calculation', () => {
    // 10000 * (3 / 100 / 12) = 25 exactly
    expect(roundNumber(10000 * (3 / 100 / 12))).toBe(25)
  })

  test('typical amortization interest with floating-point result', () => {
    // 9825 * (3 / 100 / 12) = 24.5625 → rounds to 24.56
    expect(roundNumber(9825 * (3 / 100 / 12))).toBe(24.56)
  })
})
