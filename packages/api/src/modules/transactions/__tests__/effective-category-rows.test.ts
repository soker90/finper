import { eq } from 'drizzle-orm'
import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { findEffectiveCategoryRows } from '../effective-category-rows'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'

const { users, accounts, categories, transactions, transactionSplits } = schema

describe('findEffectiveCategoryRows', () => {
  let db: DB
  let user: string
  let accountId: string
  let foodId: string
  let homeId: string
  const march = Date.UTC(2025, 2, 15, 12, 0, 0)
  const from = Date.UTC(2025, 2, 1)
  const to = Date.UTC(2025, 3, 1)

  beforeAll(() => {
    db = createTestDb()
    user = generateUsername()
    db.insert(users).values({ id: generateId(), username: user, password: 'pwd', createdAt: new Date() }).run()
    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Acc', bank: 'B', balance: 0, user }).run()
    foodId = generateId()
    homeId = generateId()
    db.insert(categories).values({ id: foodId, name: 'Comida', type: 'expense', user }).run()
    db.insert(categories).values({ id: homeId, name: 'Hogar', type: 'expense', user }).run()
  })

  afterAll(() => closeTestDb(db))

  afterEach(() => {
    db.delete(transactionSplits).run()
    db.delete(transactions).where(eq(transactions.user, user)).run()
  })

  const insertParent = (categoryId: string, amount: number): string => {
    const id = generateId()
    db.insert(transactions).values({
      id, date: march, categoryId, amount, type: 'expense', accountId, note: null, storeId: null, tags: [], user
    }).run()
    return id
  }

  it('returns the parent row when the transaction has no splits', () => {
    insertParent(foodId, 100)
    const rows = findEffectiveCategoryRows(db, { user, from, to })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ categoryId: foodId, amount: 100 })
  })

  it('does not double-count a split transaction', () => {
    const parentId = insertParent(foodId, 100)
    db.insert(transactionSplits).values([
      { id: generateId(), transactionId: parentId, categoryId: foodId, amount: 65, user },
      { id: generateId(), transactionId: parentId, categoryId: homeId, amount: 35, user }
    ]).run()

    const rows = findEffectiveCategoryRows(db, { user, from, to })
    expect(rows).toHaveLength(2)
    expect(rows.map(row => ({ categoryId: row.categoryId, amount: row.amount }))).toEqual([
      { categoryId: foodId, amount: 65 },
      { categoryId: homeId, amount: 35 }
    ])
    expect(rows.reduce((sum, row) => sum + row.amount, 0)).toBe(100)
  })
})
