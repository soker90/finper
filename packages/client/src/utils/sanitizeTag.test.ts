import { describe, expect, it } from 'vitest'
import { sanitizeTag } from 'utils'

describe('sanitizeTag', () => {
  it('converts to lowercase', () => {
    expect(sanitizeTag('VIAJE')).toBe('viaje')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeTag('  viaje  ')).toBe('viaje')
  })

  it('replaces spaces with hyphens', () => {
    expect(sanitizeTag('viaje japon')).toBe('viaje-japon')
  })

  it('removes accents and diacritics', () => {
    expect(sanitizeTag('España')).toBe('espana')
    expect(sanitizeTag('café')).toBe('cafe')
    expect(sanitizeTag('niño')).toBe('nino')
  })

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(sanitizeTag('viaje@japón!')).toBe('viaje-japon')
  })

  it('collapses multiple consecutive hyphens into one', () => {
    expect(sanitizeTag('viaje   japon')).toBe('viaje-japon')
  })

  it('removes leading and trailing hyphens', () => {
    expect(sanitizeTag('-viaje-')).toBe('viaje')
  })

  it('handles already-clean kebab-case tags', () => {
    expect(sanitizeTag('viaje-japon')).toBe('viaje-japon')
  })

  it('handles empty string', () => {
    expect(sanitizeTag('')).toBe('')
  })
})
