import jwt from 'jsonwebtoken'
import * as simplewebauthn from '@simplewebauthn/server'
import { schema, generateId } from '@soker90/finper-db'
import type { DB } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

import config from '../../../config'
import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { generateUsername } from '../../../../test/generate-values'
import { createPasskeysRepository } from '../passkeys.repository'
import { createPasskeysService } from '../passkeys.service'

jest.mock('@simplewebauthn/server')

const mockedGenerateRegistrationOptions = simplewebauthn.generateRegistrationOptions as jest.Mock
const mockedVerifyRegistrationResponse = simplewebauthn.verifyRegistrationResponse as jest.Mock
const mockedGenerateAuthenticationOptions = simplewebauthn.generateAuthenticationOptions as jest.Mock
const mockedVerifyAuthenticationResponse = simplewebauthn.verifyAuthenticationResponse as jest.Mock

const signChallengeToken = (payload: Record<string, unknown>): string =>
  jwt.sign({ ...payload, jti: generateId() }, config.webauthn.challengeTokenSecret, { expiresIn: '5m' })

describe('passkeys.service', () => {
  let db: DB
  let repo: ReturnType<typeof createPasskeysRepository>
  let service: ReturnType<typeof createPasskeysService>
  let username: string

  beforeAll(() => {
    db = createTestDb()
    repo = createPasskeysRepository(db)
    service = createPasskeysService(repo)
  })

  afterAll(() => {
    closeTestDb(db)
  })

  beforeEach(() => {
    username = generateUsername()
    db.insert(schema.users).values({ id: generateId(), username, password: 'hash', createdAt: new Date() }).run()
    jest.clearAllMocks()
  })

  afterEach(() => {
    db.delete(schema.passkeys).where(eq(schema.passkeys.user, username)).run()
    db.delete(schema.users).where(eq(schema.users.username, username)).run()
  })

  describe('getRegistrationOptions', () => {
    test('excludes existing credentials and signs a challengeToken bound to the user', async () => {
      db.insert(schema.passkeys).values({
        id: generateId(),
        user: username,
        credentialId: 'existing-cred',
        publicKey: 'pk',
        counter: 0,
        transports: '["internal"]',
        createdAt: new Date()
      }).run()

      mockedGenerateRegistrationOptions.mockResolvedValue({ challenge: 'reg-challenge' })

      const { options, challengeToken } = await service.getRegistrationOptions(username)

      expect(options.challenge).toBe('reg-challenge')
      expect(mockedGenerateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: config.webauthn.rpID,
          rpName: config.webauthn.rpName,
          userName: username,
          excludeCredentials: [{ id: 'existing-cred', transports: ['internal'] }]
        })
      )

      const payload = jwt.verify(challengeToken, config.webauthn.challengeTokenSecret) as Record<string, unknown>
      expect(payload).toMatchObject({ challenge: 'reg-challenge', username, purpose: 'registration' })
    })
  })

  describe('verifyRegistration', () => {
    test('stores the credential when the response verifies', async () => {
      mockedVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'new-credential',
            publicKey: Buffer.from('public-key-bytes'),
            counter: 0,
            transports: ['internal']
          }
        }
      })

      const challengeToken = signChallengeToken({ challenge: 'reg-challenge', username, purpose: 'registration' })

      await service.verifyRegistration({ username, response: {} as any, challengeToken, deviceLabel: 'iPhone de prueba' })

      const stored = repo.findAllByUsername(username)
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({
        credentialId: 'new-credential',
        publicKey: Buffer.from('public-key-bytes').toString('base64url'),
        counter: 0,
        transports: JSON.stringify(['internal']),
        deviceLabel: 'iPhone de prueba'
      })
    })

    test('rejects when the challengeToken belongs to a different user', async () => {
      const challengeToken = signChallengeToken({ challenge: 'reg-challenge', username: 'someone-else', purpose: 'registration' })

      await expect(service.verifyRegistration({ username, response: {} as any, challengeToken }))
        .rejects.toMatchObject({ statusCode: 401 })
      expect(repo.findAllByUsername(username)).toHaveLength(0)
    })

    test('rejects when the challengeToken purpose does not match', async () => {
      const challengeToken = signChallengeToken({ challenge: 'reg-challenge', username, purpose: 'authentication' })

      await expect(service.verifyRegistration({ username, response: {} as any, challengeToken }))
        .rejects.toMatchObject({ statusCode: 401 })
    })

    test('rejects when the challengeToken is expired or tampered', async () => {
      await expect(service.verifyRegistration({ username, response: {} as any, challengeToken: 'not-a-valid-token' }))
        .rejects.toMatchObject({ statusCode: 401 })
    })

    test('rejects when the WebAuthn verification fails', async () => {
      mockedVerifyRegistrationResponse.mockResolvedValue({ verified: false })
      const challengeToken = signChallengeToken({ challenge: 'reg-challenge', username, purpose: 'registration' })

      await expect(service.verifyRegistration({ username, response: {} as any, challengeToken }))
        .rejects.toMatchObject({ statusCode: 400 })
      expect(repo.findAllByUsername(username)).toHaveLength(0)
    })

    test('rejects when the credential id is already registered', async () => {
      mockedVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'existing-cred',
            publicKey: Buffer.from('public-key-bytes'),
            counter: 0,
            transports: ['internal']
          }
        }
      })
      db.insert(schema.passkeys).values({
        id: generateId(),
        user: username,
        credentialId: 'existing-cred',
        publicKey: 'pk',
        counter: 0,
        transports: '["internal"]',
        createdAt: new Date()
      }).run()
      const challengeToken = signChallengeToken({ challenge: 'reg-challenge', username, purpose: 'registration' })

      await expect(service.verifyRegistration({ username, response: {} as any, challengeToken }))
        .rejects.toMatchObject({ statusCode: 409 })
      expect(repo.findAllByUsername(username)).toHaveLength(1)
    })
  })

  describe('getAuthenticationOptions', () => {
    test('throws 404 when the user has no registered credentials', async () => {
      await expect(service.getAuthenticationOptions(username)).rejects.toMatchObject({ statusCode: 404 })
    })

    test('returns options and a challengeToken when credentials exist', async () => {
      db.insert(schema.passkeys).values({
        id: generateId(),
        user: username,
        credentialId: 'existing-cred',
        publicKey: 'pk',
        counter: 0,
        transports: '["internal"]',
        createdAt: new Date()
      }).run()

      mockedGenerateAuthenticationOptions.mockResolvedValue({ challenge: 'auth-challenge' })

      const { options, challengeToken } = await service.getAuthenticationOptions(username)

      expect(options.challenge).toBe('auth-challenge')
      expect(mockedGenerateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: config.webauthn.rpID,
          allowCredentials: [{ id: 'existing-cred', transports: ['internal'] }]
        })
      )

      const payload = jwt.verify(challengeToken, config.webauthn.challengeTokenSecret) as Record<string, unknown>
      expect(payload).toMatchObject({ challenge: 'auth-challenge', username, purpose: 'authentication' })
    })
  })

  describe('verifyAuthentication', () => {
    beforeEach(() => {
      db.insert(schema.passkeys).values({
        id: generateId(),
        user: username,
        credentialId: 'existing-cred',
        publicKey: Buffer.from('public-key-bytes').toString('base64url'),
        counter: 3,
        transports: '["internal"]',
        createdAt: new Date()
      }).run()
    })

    test('signs a new session token and persists the updated counter', async () => {
      mockedVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 4 }
      })
      const challengeToken = signChallengeToken({ challenge: 'auth-challenge', username, purpose: 'authentication' })

      const token = await service.verifyAuthentication({ id: 'existing-cred' } as any, challengeToken)

      expect(typeof token).toBe('string')
      expect((jwt.decode(token) as Record<string, unknown>).username).toBe(username)
      expect(repo.findAllByUsername(username)[0].counter).toBe(4)
    })

    test('rejects replaying the same challengeToken a second time', async () => {
      mockedVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 4 }
      })
      const challengeToken = signChallengeToken({ challenge: 'auth-challenge', username, purpose: 'authentication' })

      await service.verifyAuthentication({ id: 'existing-cred' } as any, challengeToken)

      await expect(service.verifyAuthentication({ id: 'existing-cred' } as any, challengeToken))
        .rejects.toMatchObject({ statusCode: 401 })
    })

    test('rejects when the credential id is unknown', async () => {
      const challengeToken = signChallengeToken({ challenge: 'auth-challenge', username, purpose: 'authentication' })

      await expect(service.verifyAuthentication({ id: 'unknown-cred' } as any, challengeToken))
        .rejects.toMatchObject({ statusCode: 401 })
    })

    test('rejects when the credential belongs to a different user than the challengeToken', async () => {
      const challengeToken = signChallengeToken({ challenge: 'auth-challenge', username: 'someone-else', purpose: 'authentication' })

      await expect(service.verifyAuthentication({ id: 'existing-cred' } as any, challengeToken))
        .rejects.toMatchObject({ statusCode: 401 })
    })

    test('rejects when the WebAuthn verification fails and does not update the counter', async () => {
      mockedVerifyAuthenticationResponse.mockResolvedValue({ verified: false })
      const challengeToken = signChallengeToken({ challenge: 'auth-challenge', username, purpose: 'authentication' })

      await expect(service.verifyAuthentication({ id: 'existing-cred' } as any, challengeToken))
        .rejects.toMatchObject({ statusCode: 401 })
      expect(repo.findAllByUsername(username)[0].counter).toBe(3)
    })
  })
})
