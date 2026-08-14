import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FINPER_TOKEN } from 'config'
import { PASSKEY_USERNAMES } from '../mock/handlers/auth/passkeys'

const { registerPasskey, authenticateWithPasskey } = vi.hoisted(() => ({
  registerPasskey: vi.fn(),
  authenticateWithPasskey: vi.fn()
}))

vi.mock('utils/webauthn', () => ({
  registerPasskey,
  authenticateWithPasskey,
  isPasskeySupported: vi.fn()
}))

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

describe('authService passkeys', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('device flags', () => {
    it('tracks whether this device has a registered passkey and the last username used', () => {
      expect(authService.hasPasskey()).toBe(false)
      expect(authService.getLastUsername()).toBeNull()

      authService.rememberPasskeyDevice('eduardo')

      expect(authService.hasPasskey()).toBe(true)
      expect(authService.getLastUsername()).toBe('eduardo')
    })

    it('only clears the "has passkey" flag when forgetting the device, keeping the last username', () => {
      authService.rememberPasskeyDevice('eduardo')

      authService.forgetPasskeyDevice()

      expect(authService.hasPasskey()).toBe(false)
      expect(authService.getLastUsername()).toBe('eduardo')
    })
  })

  describe('registerPasskey', () => {
    it('completes the registration ceremony against the backend', async () => {
      registerPasskey.mockResolvedValue({ id: 'cred-1', rawId: 'cred-1', response: {}, type: 'public-key' })

      await expect(authService.registerPasskey('Mi móvil')).resolves.toBeUndefined()
      expect(registerPasskey).toHaveBeenCalledWith({ challenge: 'reg-challenge' })
    })
  })

  describe('loginWithPasskey', () => {
    it('stores the session token returned after a successful assertion', async () => {
      authenticateWithPasskey.mockResolvedValue({ id: 'cred-1', rawId: 'cred-1', response: {}, type: 'public-key' })

      const token = await authService.loginWithPasskey(PASSKEY_USERNAMES.hasCredential)

      expect(token).toEqual(expect.any(String))
      expect(localStorage.getItem(FINPER_TOKEN)).toBe(token)
    })

    it('rejects with the server error payload when the user has no registered credential', async () => {
      await expect(authService.loginWithPasskey(PASSKEY_USERNAMES.noCredential))
        .rejects.toMatchObject({ statusCode: 404 })
    })

    it('updates the stored last username when logging in with a different user', async () => {
      authenticateWithPasskey.mockResolvedValue({ id: 'cred-1', rawId: 'cred-1', response: {}, type: 'public-key' })
      authService.rememberPasskeyDevice('previous-user')

      await authService.loginWithPasskey(PASSKEY_USERNAMES.hasCredential)

      expect(authService.getLastUsername()).toBe(PASSKEY_USERNAMES.hasCredential)
    })
  })
})
