import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createStatsRepository } from '../stats.repository'
import { StatsService } from '../stats.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { TRANSACTION } from '@soker90/finper-models'
import { eq } from 'drizzle-orm'

const { transactions, categories, accounts, users } = schema

describe('Stats Service', () => {
  let db: DB
  let repository: ReturnType<typeof createStatsRepository>
  let service: StatsService
  let user: string
  let categoryId: string
  let categoryName: string
  let accountId: string

  beforeAll(() => {
    db = createTestDb()
    repository = createStatsRepository(db)
    service = new StatsService(repository)
    user = generateUsername()
    db.insert(users).values({ id: 'stats-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
    categoryId = generateId()
    categoryName = 'Comida'
    db.insert(categories).values({ id: categoryId, name: categoryName, type: 'expense', user }).run()
    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Checking', bank: 'BankA', balance: 0, user }).run()
  })

  afterAll(() => {
    db.delete(transactions).where(eq(transactions.user, user)).run()
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
      date: overrides.date ?? Date.UTC(2025, 5, 15),
      categoryId: overrides.categoryId ?? categoryId,
      amount: overrides.amount ?? 100,
      type: overrides.type ?? TRANSACTION.Expense,
      accountId: overrides.accountId ?? accountId,
      note: overrides.note ?? null,
      storeId: overrides.storeId ?? null,
      subscriptionId: null,
      tags: overrides.tags ?? [],
      user
    }).run()
  }

  describe('getAvailableTags', () => {
    it('returns empty array when there are no tagged expenses', () => {
      expect(service.getAvailableTags(user)).toEqual([])
    })

    it('returns unique tags sorted ascending', () => {
      insertTx({ tags: ['juan', 'viaje-japon'] })
      insertTx({ tags: ['juan', 'casa'] })
      expect(service.getAvailableTags(user)).toEqual(['casa', 'juan', 'viaje-japon'])
    })

    it('ignores income/not_computable transactions', () => {
      insertTx({ tags: ['salario'], type: TRANSACTION.Income })
      insertTx({ tags: ['transf'], type: TRANSACTION.NotComputable })
      expect(service.getAvailableTags(user)).toEqual([])
    })
  })

  describe('getAvailableYears', () => {
    it('returns unique years sorted descending', () => {
      insertTx({ date: Date.UTC(2023, 5, 15), tags: ['viaje'] })
      insertTx({ date: Date.UTC(2025, 5, 15), tags: ['viaje'] })
      expect(service.getAvailableYears(user)).toEqual([2025, 2023])
    })

    it('excludes years from untagged transactions', () => {
      insertTx({ date: Date.UTC(2024, 5, 15), tags: [] })
      expect(service.getAvailableYears(user)).toEqual([])
    })
  })

  describe('getTagsSummary', () => {
    it('returns empty array when there are no tagged expenses', () => {
      expect(service.getTagsSummary(user, 2025)).toEqual([])
    })

    it('summarizes a tag with totals and byCategory', () => {
      insertTx({ amount: 100, tags: ['juan'], date: Date.UTC(2025, 5, 15) })
      insertTx({ amount: 200, tags: ['juan'], date: Date.UTC(2025, 5, 16) })

      const [summary] = service.getTagsSummary(user, 2025)
      expect(summary.tag).toBe('juan')
      expect(summary.totalAmount).toBe(300)
      expect(summary.transactionCount).toBe(2)
      expect(summary.byCategory).toHaveLength(1)
      expect(summary.byCategory[0].categoryName).toBe(categoryName)
      expect(summary.byCategory[0].amount).toBe(300)
    })

    it('excludes income and not_computable', () => {
      insertTx({ tags: ['salario'], type: TRANSACTION.Income, date: Date.UTC(2025, 5, 15) })
      insertTx({ tags: ['transf'], type: TRANSACTION.NotComputable, date: Date.UTC(2025, 5, 15) })
      expect(service.getTagsSummary(user, 2025)).toHaveLength(0)
    })

    it('filters by year', () => {
      insertTx({ amount: 100, tags: ['viaje'], date: Date.UTC(2024, 5, 15) })
      insertTx({ amount: 200, tags: ['viaje'], date: Date.UTC(2025, 5, 15) })

      expect(service.getTagsSummary(user, 2024)[0].totalAmount).toBe(100)
      expect(service.getTagsSummary(user, 2025)[0].totalAmount).toBe(200)
    })

    it('sorts tags by totalAmount desc', () => {
      insertTx({ amount: 50, tags: ['small'], date: Date.UTC(2025, 1, 1) })
      insertTx({ amount: 500, tags: ['big'], date: Date.UTC(2025, 1, 1) })
      expect(service.getTagsSummary(user, 2025).map(s => s.tag)).toEqual(['big', 'small'])
    })
  })

  describe('getTagHistoric', () => {
    it('returns per-year totals sorted desc plus global total', () => {
      insertTx({ amount: 100, tags: ['vicente'], date: Date.UTC(2024, 5, 15) })
      insertTx({ amount: 200, tags: ['vicente'], date: Date.UTC(2025, 5, 15) })

      const historic = service.getTagHistoric(user, 'vicente')
      expect(historic.tag).toBe('vicente')
      expect(historic.totalAmount).toBe(300)
      expect(historic.years).toHaveLength(2)
      expect(historic.years[0].year).toBe(2025)
      expect(historic.years[1].year).toBe(2024)
    })
  })

  describe('getTagDetail', () => {
    it('returns byCategory, totals and populated transactions for the year', () => {
      insertTx({ amount: 150, tags: ['viaje-japon'], date: Date.UTC(2025, 5, 15) })

      const detail = service.getTagDetail(user, 'viaje-japon', 2025)
      expect(detail.tag).toBe('viaje-japon')
      expect(detail.year).toBe(2025)
      expect(detail.totalAmount).toBe(150)
      expect(detail.transactionCount).toBe(1)
      expect(detail.byCategory).toHaveLength(1)
      expect(detail.byCategory[0].categoryName).toBe(categoryName)
      expect(detail.transactions).toHaveLength(1)
      expect(detail.transactions[0].category).toEqual({ _id: categoryId, name: categoryName })
    })
  })
})
