import { db as sqliteDb } from '../../../db'
import { schema, generateId, TRANSACTION } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { createTransactionsRepository } from '../transactions.repository'
import { TransactionsService } from '../transactions.service'
import { generateUsername } from '../../../../test/generate-values'

const { transactions, accounts, categories, stores, users } = schema

describe('Transactions Service', () => {
  const username = generateUsername()
  const repository = createTransactionsRepository(sqliteDb)

  let categoryId: string

  beforeAll(() => {
    sqliteDb.insert(users).values({ id: 'tx-svc-user', username, password: 'pwd', createdAt: new Date() }).run()
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Food', type: 'expense', user: username }).run()
  })

  afterAll(() => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(stores).where(eq(stores.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
  })

  const insertAccount = (balance: number): string => {
    const id = generateId()
    sqliteDb.insert(accounts).values({ id, name: 'Acc', bank: 'Bank', balance, user: username }).run()
    return id
  }

  const baseParams = (accountId: string, overrides: Record<string, any> = {}) => ({
    date: 1000,
    category: categoryId,
    amount: 10,
    type: TRANSACTION.Expense,
    account: accountId,
    user: username,
    ...overrides
  })

  // Unit: the hook is a wiring contract that cannot be observed from the HTTP client.
  describe('deleteTransaction hook', () => {
    it('should call the onTransactionDeleted hook with the subscriptionId', async () => {
      const accountId = insertAccount(0)
      const onTransactionDeleted = jest.fn()
      const service = new TransactionsService(repository, { onTransactionDeleted })

      const created = await service.addTransaction(baseParams(accountId))
      await service.deleteTransaction(created._id, username)

      expect(onTransactionDeleted).toHaveBeenCalledWith(null)
    })
  })
})
