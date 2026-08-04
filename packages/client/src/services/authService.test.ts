import { describe, it, expect, beforeEach } from 'vitest'
import { FINPER_TOKEN } from 'config'
import authService from './authService'

describe('authService token management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return null and purge localStorage when token is "undefined"', () => {
    localStorage.setItem(FINPER_TOKEN, 'undefined')

    const accessToken = authService.getAccessToken()

    expect(accessToken).toBeNull()
    expect(localStorage.getItem(FINPER_TOKEN)).toBeNull()
  })

  it('should return null and purge localStorage when token is "null"', () => {
    localStorage.setItem(FINPER_TOKEN, 'null')

    const accessToken = authService.getAccessToken()

    expect(accessToken).toBeNull()
    expect(localStorage.getItem(FINPER_TOKEN)).toBeNull()
  })

  it('should return false safely in isValidToken for malformed token string without crashing', () => {
    expect(authService.isValidToken('invalid-jwt-string')).toBe(false)
    expect(authService.isValidToken('undefined')).toBe(false)
    expect(authService.isValidToken('')).toBe(false)
  })

  it('should validate non-expired valid JWT tokens', () => {
    const futureExpiryInSeconds = Math.floor(Date.now() / 1000) + 3600
    const mockPayload = JSON.stringify({ exp: futureExpiryInSeconds, username: 'testuser' })
    const base64Payload = btoa(mockPayload)
    const validJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.mockSignature`

    expect(authService.isValidToken(validJwtToken)).toBe(true)
  })

  it('should invalidate expired JWT tokens', () => {
    const pastExpiryInSeconds = Math.floor(Date.now() / 1000) - 3600
    const mockPayload = JSON.stringify({ exp: pastExpiryInSeconds, username: 'testuser' })
    const base64Payload = btoa(mockPayload)
    const expiredJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.mockSignature`

    expect(authService.isValidToken(expiredJwtToken)).toBe(false)
  })

  it('should clear session when setSession is called with null', () => {
    localStorage.setItem(FINPER_TOKEN, 'some-token')

    authService.setSession(null)

    expect(localStorage.getItem(FINPER_TOKEN)).toBeNull()
    expect(authService.isAuthenticated()).toBe(false)
  })
})
