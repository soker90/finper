import { createTestDb, closeTestDb } from '../../../test/helpers/db'
import { generateUsername } from '../../../test/generate-values'
import { assertSplitLines, loadCategoriesById } from '../split-lines'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'

const { users, categories } = schema

describe('assertSplitLines', () => {
  const categoriesById = new Map([
    ['cat-expense', { type: 'expense' }],
    ['cat-income', { type: 'income' }]
  ])

  it('does nothing when there are no lines', () => {
    expect(() => assertSplitLines({ lines: undefined, amount: 100, type: 'expense', categoriesById })).not.toThrow()
  })

  it('does nothing for an empty array (removes the split)', () => {
    expect(() => assertSplitLines({ lines: [], amount: 100, type: 'expense', categoriesById })).not.toThrow()
  })

  it('rejects a single line', () => {
    expect(() => assertSplitLines({
      lines: [{ categoryId: 'cat-expense', amount: 100 }],
      amount: 100,
      type: 'expense',
      categoriesById
    })).toThrow()
  })

  it('rejects lines whose sum does not match the amount', () => {
    expect(() => assertSplitLines({
      lines: [{ categoryId: 'cat-expense', amount: 60 }, { categoryId: 'cat-expense', amount: 30 }],
      amount: 100,
      type: 'expense',
      categoriesById
    })).toThrow()
  })

  it('rejects a line whose category type differs from the movement type', () => {
    expect(() => assertSplitLines({
      lines: [{ categoryId: 'cat-expense', amount: 60 }, { categoryId: 'cat-income', amount: 40 }],
      amount: 100,
      type: 'expense',
      categoriesById
    })).toThrow()
  })

  it('rejects a line whose category is missing from the preloaded map', () => {
    expect(() => assertSplitLines({
      lines: [{ categoryId: 'cat-expense', amount: 60 }, { categoryId: 'missing', amount: 40 }],
      amount: 100,
      type: 'expense',
      categoriesById
    })).toThrow()
  })

  it('accepts valid lines matching the amount and type', () => {
    expect(() => assertSplitLines({
      lines: [{ categoryId: 'cat-expense', amount: 60 }, { categoryId: 'cat-expense', amount: 40 }],
      amount: 100,
      type: 'expense',
      categoriesById
    })).not.toThrow()
  })
})

describe('loadCategoriesById', () => {
  let db: DB
  let user: string
  let categoryId: string

  beforeAll(() => {
    db = createTestDb()
    user = generateUsername()
    db.insert(users).values({ id: generateId(), username: user, password: 'pwd', createdAt: new Date() }).run()
    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Comida', type: 'expense', user }).run()
  })

  afterAll(() => closeTestDb(db))

  it('returns an empty map for an empty id list without querying', () => {
    expect(loadCategoriesById(db, [], user).size).toBe(0)
  })

  it('loads categories scoped to the user, ignoring unknown ids', () => {
    const result = loadCategoriesById(db, [categoryId, 'unknown-id'], user)
    expect(result.size).toBe(1)
    expect(result.get(categoryId)).toEqual({ type: 'expense' })
  })

  it('does not return categories belonging to another user', () => {
    const otherUser = generateUsername()
    db.insert(users).values({ id: generateId(), username: otherUser, password: 'pwd', createdAt: new Date() }).run()
    const otherCategoryId = generateId()
    db.insert(categories).values({ id: otherCategoryId, name: 'Otro', type: 'expense', user: otherUser }).run()

    const result = loadCategoriesById(db, [otherCategoryId], user)
    expect(result.size).toBe(0)
  })
})
