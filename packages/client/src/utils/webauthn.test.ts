import { describe, it, expect, vi, beforeEach } from 'vitest'

const { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startRegistration, startAuthentication } = vi.hoisted(() => ({
  browserSupportsWebAuthn: vi.fn(),
  platformAuthenticatorIsAvailable: vi.fn(),
  startRegistration: vi.fn(),
  startAuthentication: vi.fn()
}))

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication
}))

import { isPasskeySupported, registerPasskey, authenticateWithPasskey } from './webauthn'

describe('utils/webauthn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isPasskeySupported', () => {
    it('returns false when the browser does not support WebAuthn at all', async () => {
      browserSupportsWebAuthn.mockReturnValue(false)

      expect(await isPasskeySupported()).toBe(false)
      expect(platformAuthenticatorIsAvailable).not.toHaveBeenCalled()
    })

    it('returns true when the browser supports WebAuthn and has a platform authenticator', async () => {
      browserSupportsWebAuthn.mockReturnValue(true)
      platformAuthenticatorIsAvailable.mockResolvedValue(true)

      expect(await isPasskeySupported()).toBe(true)
    })

    it('returns false when checking the platform authenticator throws', async () => {
      browserSupportsWebAuthn.mockReturnValue(true)
      platformAuthenticatorIsAvailable.mockRejectedValue(new Error('boom'))

      expect(await isPasskeySupported()).toBe(false)
    })
  })

  it('registerPasskey delegates to startRegistration with the given options', async () => {
    startRegistration.mockResolvedValue({ id: 'cred-1' })
    const options = { challenge: 'abc' } as any

    const result = await registerPasskey(options)

    expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: options })
    expect(result).toEqual({ id: 'cred-1' })
  })

  it('authenticateWithPasskey delegates to startAuthentication with the given options', async () => {
    startAuthentication.mockResolvedValue({ id: 'cred-1' })
    const options = { challenge: 'xyz' } as any

    const result = await authenticateWithPasskey(options)

    expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: options })
    expect(result).toEqual({ id: 'cred-1' })
  })
})
