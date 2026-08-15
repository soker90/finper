import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication
} from '@simplewebauthn/browser'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON
} from '@simplewebauthn/browser'

export const isPasskeySupported = async (): Promise<boolean> => {
  if (!browserSupportsWebAuthn()) return false

  try {
    return await platformAuthenticatorIsAvailable()
  } catch {
    return false
  }
}

export const registerPasskey = (options: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON> =>
  startRegistration({ optionsJSON: options })

export const authenticateWithPasskey = (options: PublicKeyCredentialRequestOptionsJSON): Promise<AuthenticationResponseJSON> =>
  startAuthentication({ optionsJSON: options })
