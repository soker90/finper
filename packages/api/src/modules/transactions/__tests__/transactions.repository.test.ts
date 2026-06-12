import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createTransactionsRepository } from '../transactions.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { transactions, accounts, categories, stores, users } = schema

describe('Transactions Repository', () => {
  let db: DB
  let repository: ReturnType<typeof createTransactionsRepository>
  let user: string
  let accountId: string
  let categoryId: string
  let storeId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createTransactionsRepository(db)
    user = generateUsername()
    db.insert(users).values({ id: 'tx-repo-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()

    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user }).run()
    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Food', type: 'expense', user }).run()
    storeId = generateId()
    db.insert(stores).values({ id: storeId, name: 'Mercadona', user }).run()
  })

  afterAll(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
    db.delete(stores).where(eq(stores.user, user)).run()
    db.delete(categories).where(eq(categories.user, user)).run()
    db.delete(accounts).where(eq(accounts.user, user)).run()
    db.delete(users).where(eq(users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
  })

  const insertTx = (overrides: Record<string, any> = {}) => {
    const id = generateId()
    db.insert(transactions).values({
      id,
      date: overrides.date ?? 1000,
      categoryId: overrides.categoryId ?? categoryId,
      amount: overrides.amount ?? 10,
      type: overrides.type ?? 'expense',
      accountId: overrides.accountId ?? accountId,
      note: overrides.note ?? null,
      storeId: overrides.storeId ?? storeId,
      subscriptionId: overrides.subscriptionId ?? null,
      tags: overrides.tags ?? [],
      user: overrides.user ?? user
    }).run()
    return id
  }

  describe('findById', () => {
    it('should return undefined when it belongs to another user', () => {
      const id = insertTx()
      expect(repository.findById(id, generateUsername())).toBeUndefined()
    })
  })

  describe('findMany', () => {
    it('should order by date desc', () => {
      insertTx({ date: 100 })
      insertTx({ date: 300 })
      insertTx({ date: 200 })
      const dates = repository.findMany({ user }).map(r => r.date)
      expect(dates).toEqual([300, 200, 100])
    })

    it('should filter by type', () => {
      insertTx({ type: 'expense' })
      insertTx({ type: 'income' })
      const result = repository.findMany({ user, type: 'income' })
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('income')
    })

    it('should paginate with page and limit', () => {
      insertTx({ date: 1 })
      insertTx({ date: 2 })
      insertTx({ date: 3 })
      expect(repository.findMany({ user, page: 0, limit: 2 })).toHaveLength(2)
      expect(repository.findMany({ user, page: 1, limit: 2 })).toHaveLength(1)
    })
  })
})
