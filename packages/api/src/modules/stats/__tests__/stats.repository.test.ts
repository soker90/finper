import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createStatsRepository } from '../stats.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId, TRANSACTION } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { transactions, categories, accounts, stores, users, transactionSplits } = schema

describe('Stats Repository', () => {
  let db: DB
  let repository: ReturnType<typeof createStatsRepository>
  let user: string
  let categoryId: string
  let accountId: string
  let storeId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createStatsRepository(db)
    user = generateUsername()
    db.insert(users).values({ id: 'stats-repo-user', username: user, password: 'pwd', createdAt: new Date() }).run()
    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Comida', type: 'expense', user }).run()
    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user }).run()
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
    db.insert(transactions).values({
      id: generateId(),
      date: overrides.date ?? 1000,
      categoryId,
      amount: overrides.amount ?? 100,
      type: overrides.type ?? TRANSACTION.Expense,
      accountId,
      note: overrides.note ?? null,
      storeId: overrides.storeId ?? null,
      subscriptionId: null,
      tags: overrides.tags ?? [],
      user
    }).run()
  }

  describe('findExpenses', () => {
    it('returns only expense transactions with categoryName', () => {
      insertTx({ type: TRANSACTION.Expense, tags: ['a'] })
      insertTx({ type: TRANSACTION.Income, tags: ['b'] })
      const rows = repository.findExpenses(user)
      expect(rows).toHaveLength(1)
      expect(rows[0].categoryName).toBe('Comida')
    })

    it('filters by date range when provided', () => {
      insertTx({ date: 500 })
      insertTx({ date: 1500 })
      expect(repository.findExpenses(user, { from: 1000, to: 2000 })).toHaveLength(1)
    })
  })

  describe('findExpenseDetails', () => {
    it('returns expenses in range ordered date desc with populated joins', () => {
      insertTx({ date: 100, storeId })
      insertTx({ date: 300, storeId })
      const rows = repository.findExpenseDetails(user, 0, 1000)
      expect(rows.map(r => r.date)).toEqual([300, 100])
      expect(rows[0].accountBank).toBe('BankA')
      expect(rows[0].storeName).toBe('Mercadona')
    })

    it('expands split transactions into one row per line, each with its own splitId', () => {
      const txId = generateId()
      db.insert(transactions).values({
        id: txId,
        date: 200,
        categoryId,
        amount: 100,
        type: TRANSACTION.Expense,
        accountId,
        note: null,
        storeId: null,
        subscriptionId: null,
        tags: [],
        user
      }).run()
      const splitIds = [generateId(), generateId()]
      db.insert(transactionSplits).values([
        { id: splitIds[0], transactionId: txId, categoryId, amount: 60, tags: [], user },
        { id: splitIds[1], transactionId: txId, categoryId, amount: 40, tags: [], user }
      ]).run()

      const rows = repository.findExpenseDetails(user, 0, 1000)

      expect(rows).toHaveLength(2)
      expect(rows.every(row => row.id === txId)).toBe(true)
      expect(rows.map(row => row.splitId).sort()).toEqual([...splitIds].sort())
      expect(new Set(rows.map(row => row.splitId)).size).toBe(2)

      db.delete(transactionSplits).where(eq(transactionSplits.transactionId, txId)).run()
    })

    it('treats a single orphan split row as a non-split transaction (falls back to the parent row)', () => {
      const txId = generateId()
      db.insert(transactions).values({
        id: txId,
        date: 400,
        categoryId,
        amount: 100,
        type: TRANSACTION.Expense,
        accountId,
        note: null,
        storeId: null,
        subscriptionId: null,
        tags: ['solo'],
        user
      }).run()
      const orphanSplitId = generateId()
      db.insert(transactionSplits).values({ id: orphanSplitId, transactionId: txId, categoryId, amount: 100, tags: [], user }).run()

      const rows = repository.findExpenseDetails(user, 0, 1000)

      expect(rows).toHaveLength(1)
      expect(rows[0].id).toBe(txId)
      expect(rows[0].splitId).toBeUndefined()
      expect(rows[0].tags).toEqual(['solo'])

      db.delete(transactionSplits).where(eq(transactionSplits.transactionId, txId)).run()
    })
  })
})
