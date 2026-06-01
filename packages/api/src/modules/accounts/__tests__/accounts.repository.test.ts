import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { db as sqliteDb } from '../../../db'
import { accountsRepository } from '../accounts.repository'
import { generateUsername } from '../../../../test/generate-values'

const { accounts, users } = schema

describe('accountsRepository', () => {
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

  test('should create account with rounded balance', async () => {
    const data = { name: 'Test Bank', bank: 'MyBank', balance: 100.126 }
    const account = await accountsRepository.create(username, data)

    expect(account.id).toBeDefined()
    expect(account.user).toBe(username)
    expect(account.name).toBe('Test Bank')
    expect(account.balance).toBe(100.13)
    expect(account.isActive).toBe(true)
  })

  test('should find active accounts by user', async () => {
    await accountsRepository.create(username, { name: 'A1', bank: 'B1' })
    const a2 = await accountsRepository.create(username, { name: 'A2', bank: 'B2' })
    await accountsRepository.update(a2.id, username, { isActive: false })

    const found = await accountsRepository.findByUser(username)
    expect(found).toHaveLength(1)
    expect(found[0].name).toBe('A1')
  })

  test('should find account by id', async () => {
    const account = await accountsRepository.create(username, { name: 'A1', bank: 'B1' })
    const found = await accountsRepository.findById(account.id, username)
    expect(found).toBeDefined()
    expect(found?.id).toBe(account.id)
  })

  test('should update account and round balance', async () => {
    const account = await accountsRepository.create(username, { name: 'A1', bank: 'B1', balance: 50 })
    const updated = await accountsRepository.update(account.id, username, { balance: 50.555 })
    
    expect(updated?.balance).toBe(50.56)
  })

  test('should get total balance excluding inactive', async () => {
    await accountsRepository.create(username, { name: 'A1', bank: 'B1', balance: 100 })
    await accountsRepository.create(username, { name: 'A2', bank: 'B1', balance: 200 })
    const a3 = await accountsRepository.create(username, { name: 'A3', bank: 'B1', balance: 300 })
    await accountsRepository.update(a3.id, username, { isActive: false })

    const total = await accountsRepository.getTotalBalanceByUser(username)
    expect(total).toBe(300)
  })

  test('should adjust balance atomically with round', async () => {
    const account = await accountsRepository.create(username, { name: 'A1', bank: 'B1', balance: 100 })
    
    const updated = await accountsRepository.adjustBalance(account.id, 50.126)
    expect(updated?.balance).toBe(150.13) // 100 + 50.126 = 150.126 -> rounded to 150.13
  })

  test('should adjust balance atomically without round', async () => {
    const account = await accountsRepository.create(username, { name: 'A1', bank: 'B1', balance: 100 })
    
    const updated = await accountsRepository.adjustBalance(account.id, 50.126, { round: false })
    expect(updated?.balance).toBe(150.126)
  })
})
