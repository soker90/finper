import { describe, it, expect } from 'vitest'
import { generateId, isValidId, spanishCompare, roundMoney } from '../src/adapters'

describe('generateId', () => {
  it('returns a 24-character hex string', () => {
    const id = generateId()
    expect(id).toMatch(/^[0-9a-f]{24}$/)
  })

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()))
    expect(ids.size).toBe(1000)
  })
})

describe('isValidId', () => {
  it('accepts a lowercase 24-hex string', () => {
    expect(isValidId('0123456789abcdef01234567')).toBe(true)
  })

  it('accepts an uppercase 24-hex string', () => {
    expect(isValidId('0123456789ABCDEF01234567')).toBe(true)
  })

  it('rejects non-string values', () => {
    expect(isValidId(123)).toBe(false)
    expect(isValidId(null)).toBe(false)
    expect(isValidId(undefined)).toBe(false)
  })

  it('rejects ids with the wrong length', () => {
    expect(isValidId('abc')).toBe(false)
    expect(isValidId('0123456789abcdef0123456789')).toBe(false)
  })

  it('rejects ids with non-hex characters', () => {
    expect(isValidId('0123456789abcdef0123456g')).toBe(false)
    expect(isValidId('0123456789abcdef0123456_')).toBe(false)
  })
})

describe('spanishCompare', () => {
  it('is case-insensitive', () => {
    expect(spanishCompare('A', 'a')).toBe(0)
  })

  it('ignores accent marks (base sensitivity)', () => {
    expect(spanishCompare('a', 'á')).toBe(0)
  })

  it('sorts a before b', () => {
    expect(spanishCompare('a', 'b')).toBeLessThan(0)
  })

  it('sorts ñ after n but before o', () => {
    expect(spanishCompare('n', 'ñ')).toBeLessThan(0)
    expect(spanishCompare('ñ', 'o')).toBeLessThan(0)
  })
})

describe('roundMoney', () => {
  it('rounds a integer value', () => {
    expect(roundMoney(1)).toBe(1)
  })

  it('rounds down when third decimal is less than 5', () => {
    expect(roundMoney(1.004)).toBe(1)
  })

  it('rounds up when third decimal is exactly 5 (no IEEE 754 truncation)', () => {
    expect(roundMoney(1.005)).toBe(1.01)
  })

  it('rounds up for other x.xx5 cases', () => {
    expect(roundMoney(1.045)).toBe(1.05)
    expect(roundMoney(1.095)).toBe(1.1)
  })

  it('carries the rounding to the integer part', () => {
    expect(roundMoney(1.999)).toBe(2)
  })

  it('returns zero for zero', () => {
    expect(roundMoney(0)).toBe(0)
  })

  it('rounds a typical financial value', () => {
    expect(roundMoney(100.126)).toBe(100.13)
  })

  it('rounds negative x.xx5 away from zero (symmetric)', () => {
    expect(roundMoney(-1.005)).toBe(-1.01)
  })

  it('rounds a negative value with third decimal < 5 toward zero', () => {
    expect(roundMoney(-1.004)).toBe(-1)
  })

  it('rounds a typical amortization interest calculation', () => {
    expect(roundMoney(10000 * (3 / 100 / 12))).toBe(25)
  })

  it('rounds a floating-point amortization interest result', () => {
    expect(roundMoney(9825 * (3 / 100 / 12))).toBe(24.56)
  })
})
