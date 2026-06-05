import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { db as sqliteDb } from '../../../db'
import { accountsRepository } from '../accounts.repository'
import { generateUsername } from '../../../../test/generate-values'
import { ERROR_MESSAGE } from '../../../i18n'
import {
  validateAccountCreateParams,
  validateAccountEditParams,
  validateAccountTransferParams
} from '../accounts.validators'

const { accounts, users } = schema

describe('accounts.validators', () => {
  const username = generateUsername()

  beforeAll(() => {
    sqliteDb.insert(users).values({ id: generateId(), username, password: 'password', createdAt: new Date() }).run()
  })

  afterEach(() => {
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
  })

  afterAll(() => {
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  describe('validateAccountCreateParams', () => {
    test('should throw if required fields are missing', () => {
      expect(() => validateAccountCreateParams({})).toThrow()
    })
    test('should return the value if valid', () => {
      expect(validateAccountCreateParams({ name: 'A', bank: 'B', balance: 10 }))
        .toMatchObject({ name: 'A', bank: 'B', balance: 10 })
    })
  })

  describe('validateAccountEditParams', () => {
    test('should throw 400 if id is invalid', async () => {
      await expect(validateAccountEditParams({ params: { id: 'invalid' }, body: {}, user: username }))
        .rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.COMMON.INVALID_ID } })
    })
    test('should throw 404 if account does not exist', async () => {
      await expect(validateAccountEditParams({
        params: { id: generateId() }, body: { name: 'X', bank: 'Y', balance: 1 }, user: username
      })).rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.ACCOUNT.NOT_FOUND } })
    })
    test('should throw 422 if body is invalid', async () => {
      const created = await accountsRepository.create(username, { name: 'A', bank: 'B' })
      await expect(validateAccountEditParams({ params: { id: created.id }, body: {}, user: username }))
        .rejects.toMatchObject({ payload: { statusCode: 422 } })
    })
    test('should return id and value if valid', async () => {
      const created = await accountsRepository.create(username, { name: 'A', bank: 'B' })
      const res = await validateAccountEditParams({
        params: { id: created.id }, body: { name: 'New', bank: 'B2', balance: 5 }, user: username
      })
      expect(res).toMatchObject({ id: created.id, value: { name: 'New', bank: 'B2', balance: 5 } })
    })
  })

  describe('validateAccountTransferParams', () => {
    test('should throw if source equals destination', () => {
      expect(() => validateAccountTransferParams({ sourceId: 'a', destinationId: 'a', amount: 10 })).toThrow()
    })
    test('should throw if amount is not positive', () => {
      expect(() => validateAccountTransferParams({ sourceId: 'a', destinationId: 'b', amount: -5 })).toThrow()
    })
    test('should return the value if valid', () => {
      expect(validateAccountTransferParams({ sourceId: 'a', destinationId: 'b', amount: 10 }))
        .toMatchObject({ sourceId: 'a', destinationId: 'b', amount: 10 })
    })
  })
})
