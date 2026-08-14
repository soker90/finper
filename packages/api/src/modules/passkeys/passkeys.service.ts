import jwt from 'jsonwebtoken'
import Boom from '@hapi/boom'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON
} from '@simplewebauthn/server'

import config from '../../config'
import signToken from '../../helpers/sign-token'
import { ERROR_MESSAGE } from '../../i18n'
import { createPasskeysRepository, passkeysRepository } from './passkeys.repository'

type ChallengePurpose = 'registration' | 'authentication'

type ChallengeTokenPayload = {
  challenge: string
  username: string
  purpose: ChallengePurpose
}

const signChallengeToken = (payload: ChallengeTokenPayload): string =>
  jwt.sign(payload, config.webauthn.challengeTokenSecret, { expiresIn: config.webauthn.challengeTokenTtl } as any)

const verifyChallengeToken = (token: string, purpose: ChallengePurpose): ChallengeTokenPayload => {
  try {
    const payload = jwt.verify(token, config.webauthn.challengeTokenSecret) as ChallengeTokenPayload
    if (payload.purpose !== purpose) {
      throw new Error('Unexpected challenge purpose')
    }
    return payload
  } catch {
    throw Boom.unauthorized(ERROR_MESSAGE.PASSKEY.INVALID_CHALLENGE).output
  }
}

const parseTransports = (transports: string | null): string[] => {
  if (!transports) return []
  try {
    return JSON.parse(transports)
  } catch {
    return []
  }
}

export const createPasskeysService = (repo: ReturnType<typeof createPasskeysRepository>) => ({
  getRegistrationOptions: async (username: string) => {
    const existingCredentials = repo.findAllByUsername(username)

    const options = await generateRegistrationOptions({
      rpName: config.webauthn.rpName,
      rpID: config.webauthn.rpID,
      userName: username,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(credential => ({
        id: credential.credentialId,
        transports: parseTransports(credential.transports) as any
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment: 'platform'
      }
    })

    const challengeToken = signChallengeToken({ challenge: options.challenge, username, purpose: 'registration' })

    return { options, challengeToken }
  },

  verifyRegistration: async (
    username: string,
    response: RegistrationResponseJSON,
    challengeToken: string,
    deviceLabel?: string
  ) => {
    const { challenge, username: tokenUsername } = verifyChallengeToken(challengeToken, 'registration')
    if (tokenUsername !== username) {
      throw Boom.unauthorized().output
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: config.webauthn.expectedOrigin,
      expectedRPID: config.webauthn.rpID
    })

    if (!verification.verified || !verification.registrationInfo) {
      throw Boom.badRequest(ERROR_MESSAGE.PASSKEY.VERIFICATION_FAILED).output
    }

    const { credential } = verification.registrationInfo

    repo.create(username, {
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: JSON.stringify(credential.transports ?? []),
      deviceLabel
    })
  },

  getAuthenticationOptions: async (username: string) => {
    const credentials = repo.findAllByUsername(username)

    if (credentials.length === 0) {
      throw Boom.notFound(ERROR_MESSAGE.PASSKEY.NOT_FOUND).output
    }

    const options = await generateAuthenticationOptions({
      rpID: config.webauthn.rpID,
      userVerification: 'required',
      allowCredentials: credentials.map(credential => ({
        id: credential.credentialId,
        transports: parseTransports(credential.transports) as any
      }))
    })

    const challengeToken = signChallengeToken({ challenge: options.challenge, username, purpose: 'authentication' })

    return { options, challengeToken }
  },

  verifyAuthentication: async (response: AuthenticationResponseJSON, challengeToken: string): Promise<string> => {
    const { challenge, username } = verifyChallengeToken(challengeToken, 'authentication')

    const stored = repo.findByCredentialId(response.id)
    if (!stored || stored.user !== username) {
      throw Boom.unauthorized().output
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: config.webauthn.expectedOrigin,
      expectedRPID: config.webauthn.rpID,
      credential: {
        id: stored.credentialId,
        publicKey: Buffer.from(stored.publicKey, 'base64url'),
        counter: stored.counter,
        transports: parseTransports(stored.transports) as any
      }
    })

    if (!verification.verified) {
      throw Boom.unauthorized().output
    }

    repo.updateCounter(stored.credentialId, verification.authenticationInfo.newCounter)

    return signToken({ username: stored.user })
  }
})

export const passkeysService = createPasskeysService(passkeysRepository)
