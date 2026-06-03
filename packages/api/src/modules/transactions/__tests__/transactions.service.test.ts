import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { createTransactionsRepository } from '../transactions.repository'
import { TransactionsService } from '../transactions.service'
import { generateUsername } from '../../../../test/generate-values'
import { getTransactionAmount } from '../../../services/utils'
import { roundNumber } from '../../../utils'
import { TRANSACTION } from '@soker90/finper-models'

const { transactions, accounts, categories, stores, users } = schema

describe('Transactions Service', () => {
  const username = generateUsername()
  const repository = createTransactionsRepository(sqliteDb)

  let categoryId: string

  beforeAll(() => {
    sqliteDb.insert(users).values({ id: 'tx-svc-user', username, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
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

  const balanceOf = (id: string): number =>
    sqliteDb.select().from(accounts).where(eq(accounts.id, id)).get()!.balance

  const baseParams = (accountId: string, overrides: Record<string, any> = {}) => ({
    date: 1000,
    category: categoryId,
    amount: 10,
    type: TRANSACTION.Expense,
    account: accountId,
    user: username,
    ...overrides
  })

  describe('addTransaction', () => {
    it('should create a transaction and return it serialized with sanitized tags', async () => {
      const accountId = insertAccount(0)
      const service = new TransactionsService(repository)
      const result = await service.addTransaction(baseParams(accountId, { tags: [' Juan ', '#VIAJE-japon', 'juan'] }))

      expect(result._id).toBeDefined()
      expect(result.tags).toEqual(['juan', 'viaje-japon'])
      expect(result.account).toBe(accountId)
      expect((result as any).user).toBeUndefined()
    })

    it('should default tags to an empty array', async () => {
      const accountId = insertAccount(0)
      const service = new TransactionsService(repository)
      const result = await service.addTransaction(baseParams(accountId))
      expect(result.tags).toEqual([])
    })

    it.each([TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable])(
      'should update the account balance when creating a %s transaction', async (type) => {
        const balance = 500
        const accountId = insertAccount(balance)
        const service = new TransactionsService(repository)
        const amount = 30

        await service.addTransaction(baseParams(accountId, { type, amount }))

        const expected = roundNumber(balance + getTransactionAmount({ amount, type } as any))
        expect(balanceOf(accountId)).toBeCloseTo(expected, 2)
      })
  })

  describe('editTransaction', () => {
    it.each([
      { old: TRANSACTION.Income, updated: TRANSACTION.Expense },
      { old: TRANSACTION.Expense, updated: TRANSACTION.NotComputable },
      { old: TRANSACTION.NotComputable, updated: TRANSACTION.Income },
      { old: TRANSACTION.Expense, updated: TRANSACTION.Income },
      { old: TRANSACTION.Income, updated: TRANSACTION.NotComputable },
      { old: TRANSACTION.NotComputable, updated: TRANSACTION.Expense }
    ])('should adjust balance editing $old -> $updated', async ({ old, updated }) => {
      const balance = 500
      const accountId = insertAccount(balance)
      const service = new TransactionsService(repository)
      const amountOld = 40
      const amountNew = 25

      const created = await service.addTransaction(baseParams(accountId, { type: old, amount: amountOld }))
      await service.editTransaction({
        id: created._id,
        value: { date: 1000, category: categoryId, amount: amountNew, type: updated, account: accountId, user: username }
      })

      const expected = roundNumber(balance + getTransactionAmount({ amount: amountNew, type: updated } as any))
      expect(balanceOf(accountId)).toBeCloseTo(expected, 2)
    })
  })

  describe('deleteTransaction', () => {
    it.each([TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable])(
      'should revert the balance when deleting a %s transaction', async (type) => {
        const balance = 500
        const accountId = insertAccount(balance)
        const service = new TransactionsService(repository)

        const created = await service.addTransaction(baseParams(accountId, { type, amount: 40 }))
        await service.deleteTransaction(created._id, username)

        expect(balanceOf(accountId)).toBeCloseTo(roundNumber(balance), 2)
      })

    it('should call the onTransactionDeleted hook with the subscriptionId', async () => {
      const accountId = insertAccount(0)
      const onTransactionDeleted = jest.fn()
      const service = new TransactionsService(repository, { onTransactionDeleted })

      const created = await service.addTransaction(baseParams(accountId))
      await service.deleteTransaction(created._id, username)

      expect(onTransactionDeleted).toHaveBeenCalledWith(null)
    })
  })

  describe('getTransactions', () => {
    it('should return transactions populated with category/account/store', async () => {
      const accountId = insertAccount(0)
      const storeId = generateId()
      sqliteDb.insert(stores).values({ id: storeId, name: 'Mercadona', user: username }).run()
      const service = new TransactionsService(repository)

      await service.addTransaction(baseParams(accountId, { store: storeId }))
      const result = service.getTransactions({ user: username })

      expect(result).toHaveLength(1)
      expect(result[0].category).toEqual({ _id: categoryId, name: 'Food' })
      expect(result[0].account).toEqual({ _id: accountId, name: 'Acc', bank: 'Bank' })
      expect(result[0].store).toEqual({ _id: storeId, name: 'Mercadona' })
    })
  })
})
