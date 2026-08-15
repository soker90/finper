import supertest from 'supertest'
import * as simplewebauthn from '@simplewebauthn/server'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

import { server } from '../../../server'
import { db as sqliteDb } from '../../../db'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'

jest.mock('@simplewebauthn/server')

const mockedGenerateRegistrationOptions = simplewebauthn.generateRegistrationOptions as jest.Mock
const mockedVerifyRegistrationResponse = simplewebauthn.verifyRegistrationResponse as jest.Mock
const mockedGenerateAuthenticationOptions = simplewebauthn.generateAuthenticationOptions as jest.Mock
const mockedVerifyAuthenticationResponse = simplewebauthn.verifyAuthenticationResponse as jest.Mock

describe('Passkeys controller', () => {
  const username = generateUsername()
  let token: string

  beforeAll(async () => {
    token = await requestLogin(server.app, { username })
  })

  afterAll(() => {
    sqliteDb.delete(schema.users).where(eq(schema.users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(schema.passkeys).where(eq(schema.passkeys.user, username)).run()
    jest.clearAllMocks()
  })

  describe('POST /registration-options', () => {
    const path = '/api/auth/webauthn/registration-options'

    test('without a token, it responds 401', async () => {
      await supertest(server.app).post(path).send({}).expect(401)
    })

    test('with a valid token, it responds with options and a challengeToken', async () => {
      mockedGenerateRegistrationOptions.mockResolvedValue({ challenge: 'reg-challenge' })

      const response = await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({})
        .expect(200)

      expect(response.body.options.challenge).toBe('reg-challenge')
      expect(response.body.challengeToken).toEqual(expect.any(String))
    })
  })

  describe('POST /registration-verify', () => {
    const path = '/api/auth/webauthn/registration-verify'

    const getChallengeToken = async (): Promise<string> => {
      mockedGenerateRegistrationOptions.mockResolvedValue({ challenge: 'reg-challenge' })
      const response = await supertest(server.app)
        .post('/api/auth/webauthn/registration-options')
        .auth(token, { type: 'bearer' })
        .send({})
      return response.body.challengeToken
    }

    test('without a token, it responds 401', async () => {
      await supertest(server.app).post(path).send({}).expect(401)
    })

    test('with a malformed body, it responds 422', async () => {
      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({ challengeToken: 'abc' })
        .expect(422)
    })

    test('when the WebAuthn verification fails, it responds 400', async () => {
      const challengeToken = await getChallengeToken()
      mockedVerifyRegistrationResponse.mockResolvedValue({ verified: false })

      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({
          challengeToken,
          response: { id: 'cred-1', rawId: 'cred-1', response: {}, type: 'public-key' }
        })
        .expect(400)
    })

    test('when the verification succeeds, it stores the credential and responds 204', async () => {
      const challengeToken = await getChallengeToken()
      mockedVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'stored-credential',
            publicKey: Buffer.from('public-key-bytes'),
            counter: 0,
            transports: ['internal']
          }
        }
      })

      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({
          challengeToken,
          response: { id: 'stored-credential', rawId: 'stored-credential', response: {}, type: 'public-key' },
          deviceLabel: 'Dispositivo de test'
        })
        .expect(204)

      const stored = sqliteDb.select().from(schema.passkeys).where(eq(schema.passkeys.user, username)).all()
      expect(stored).toHaveLength(1)
      expect(stored[0].credentialId).toBe('stored-credential')
    })
  })

  describe('POST /authentication-options', () => {
    const path = '/api/auth/webauthn/authentication-options'

    test('with a malformed body, it responds 422', async () => {
      await supertest(server.app).post(path).send({}).expect(422)
    })

    test('for a user with no registered passkey, it responds 404', async () => {
      await supertest(server.app).post(path).send({ username }).expect(404)
    })

    test('for a user with a registered passkey, it responds with options and a challengeToken', async () => {
      sqliteDb.insert(schema.passkeys).values({
        id: generateId(),
        user: username,
        credentialId: 'existing-cred',
        publicKey: 'pk',
        counter: 0,
        transports: '["internal"]',
        createdAt: new Date()
      }).run()

      mockedGenerateAuthenticationOptions.mockResolvedValue({ challenge: 'auth-challenge' })

      const response = await supertest(server.app).post(path).send({ username }).expect(200)

      expect(response.body.options.challenge).toBe('auth-challenge')
      expect(response.body.challengeToken).toEqual(expect.any(String))
    })
  })

  describe('POST /authentication-verify', () => {
    const path = '/api/auth/webauthn/authentication-verify'

    test('with a malformed body, it responds 422', async () => {
      await supertest(server.app).post(path).send({}).expect(422)
    })

    test('with an invalid challengeToken, it responds 401', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          challengeToken: 'not-a-valid-token',
          response: { id: 'cred-1', rawId: 'cred-1', response: {}, type: 'public-key' }
        })
        .expect(401)
    })

    test('full round trip: registers then logs in with the passkey', async () => {
      mockedGenerateRegistrationOptions.mockResolvedValue({ challenge: 'reg-challenge' })
      const registrationOptionsResponse = await supertest(server.app)
        .post('/api/auth/webauthn/registration-options')
        .auth(token, { type: 'bearer' })
        .send({})

      mockedVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'round-trip-credential',
            publicKey: Buffer.from('public-key-bytes'),
            counter: 0,
            transports: ['internal']
          }
        }
      })
      await supertest(server.app)
        .post('/api/auth/webauthn/registration-verify')
        .auth(token, { type: 'bearer' })
        .send({
          challengeToken: registrationOptionsResponse.body.challengeToken,
          response: { id: 'round-trip-credential', rawId: 'round-trip-credential', response: {}, type: 'public-key' }
        })
        .expect(204)

      mockedGenerateAuthenticationOptions.mockResolvedValue({ challenge: 'auth-challenge' })
      const authOptionsResponse = await supertest(server.app)
        .post('/api/auth/webauthn/authentication-options')
        .send({ username })
        .expect(200)

      mockedVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 1 }
      })
      const verifyResponse = await supertest(server.app)
        .post(path)
        .send({
          challengeToken: authOptionsResponse.body.challengeToken,
          response: { id: 'round-trip-credential', rawId: 'round-trip-credential', response: {}, type: 'public-key' }
        })
        .expect(200)

      expect(verifyResponse.body.token).toEqual(expect.any(String))
    })
  })
})
