import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { db as sqliteDb } from '../../../db'
import { accountsService } from '../accounts.service'
import { accountsRepository } from '../accounts.repository'
import { generateUsername } from '../../../../test/generate-values'
import { ERROR_MESSAGE } from '../../../i18n'

const { accounts, users } = schema

describe('accountsService', () => {
  const username = generateUsername()

  beforeAll(() => {
    sqliteDb.insert(users).values({
      id: generateId(),
      username,
      password: 'password',
      createdAt: new Date()
    }).run()
  })

  afterEach(() => {
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
  })

  afterAll(() => {
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  describe('getAccounts', () => {
    test('should return only active accounts', async () => {
      await accountsRepository.create(username, { name: 'A', bank: 'B' })
      const acc = await accountsRepository.create(username, { name: 'A2', bank: 'B2' })
      await accountsRepository.update(acc.id, username, { isActive: false })

      const res = await accountsService.getAccounts(username)
      expect(res).toHaveLength(1)
      expect(res[0].name).toBe('A')
    })
  })

  describe('getAccount', () => {
    test('should throw 400 if invalid id', async () => {
      await expect(accountsService.getAccount({ id: 'invalid', user: username }))
        .rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.COMMON.INVALID_ID } })
    })

    test('should throw 404 if not found', async () => {
      await expect(accountsService.getAccount({ id: generateId(), user: username }))
        .rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.ACCOUNT.NOT_FOUND } })
    })

    test('should return account', async () => {
      const created = await accountsRepository.create(username, { name: 'A', bank: 'B' })
      const found = await accountsService.getAccount({ id: created.id, user: username })
      expect(found.id).toBe(created.id)
    })
  })

  describe('editAccount', () => {
    test('should throw 400 if invalid id', async () => {
      await expect(accountsService.editAccount({ id: 'invalid', user: username, value: {} }))
        .rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.COMMON.INVALID_ID } })
    })

    test('should throw 404 if not found', async () => {
      await expect(accountsService.editAccount({ id: generateId(), user: username, value: {} }))
        .rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.ACCOUNT.NOT_FOUND } })
    })

    test('should edit account', async () => {
      const created = await accountsRepository.create(username, { name: 'A', bank: 'B' })
      const updated = await accountsService.editAccount({ id: created.id, user: username, value: { name: 'NewName' } })
      expect(updated.name).toBe('NewName')
    })
  })

  describe('transfer', () => {
    test('should throw 400 if invalid ids', async () => {
      await expect(accountsService.transfer({ sourceId: 'invalid', destinationId: generateId(), amount: 10, user: username }))
        .rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.COMMON.INVALID_ID } })
    })

    test('should throw 404 if source not found', async () => {
      await expect(accountsService.transfer({ sourceId: generateId(), destinationId: generateId(), amount: 10, user: username }))
        .rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.ACCOUNT.NOT_FOUND } })
    })

    test('should throw 404 if destination not found', async () => {
      const source = await accountsRepository.create(username, { name: 'S', bank: 'B', balance: 100 })
      await expect(accountsService.transfer({ sourceId: source.id, destinationId: generateId(), amount: 10, user: username }))
        .rejects.toMatchObject({ payload: { message: ERROR_MESSAGE.ACCOUNT.NOT_FOUND } })
    })

    test('should throw 400 if insufficient balance', async () => {
      const source = await accountsRepository.create(username, { name: 'S', bank: 'B', balance: 50 })
      const dest = await accountsRepository.create(username, { name: 'D', bank: 'B', balance: 0 })
      
      await expect(accountsService.transfer({ sourceId: source.id, destinationId: dest.id, amount: 100, user: username }))
        .rejects.toMatchObject({ payload: { message: 'Insufficient balance' } })
    })

    test('should transfer successfully', async () => {
      const source = await accountsRepository.create(username, { name: 'S', bank: 'B', balance: 100 })
      const dest = await accountsRepository.create(username, { name: 'D', bank: 'B', balance: 50 })
      
      await accountsService.transfer({ sourceId: source.id, destinationId: dest.id, amount: 25, user: username })

      const sAfter = await accountsRepository.findById(source.id, username)
      const dAfter = await accountsRepository.findById(dest.id, username)

      expect(sAfter.balance).toBe(75)
      expect(dAfter.balance).toBe(75)
    })
  })
})
