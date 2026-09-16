import { createTestDb, closeTestDb } from '../../../test/helpers/db'
import { generateUsername } from '../../../test/generate-values'
import { assertSplitLines, assertSplitEditInvariant, loadCategoriesById } from '../split-lines'
import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'

const { users, categories } = schema

describe('assertSplitLines', () => {
  const categoriesById = new Map([
    ['cat-expense', { type: 'expense' }],
    ['cat-expense-2', { type: 'expense' }],
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

  it('rejects more than 5 lines', () => {
    expect(() => assertSplitLines({
      lines: [
        { categoryId: 'cat-1', amount: 20 },
        { categoryId: 'cat-2', amount: 20 },
        { categoryId: 'cat-3', amount: 20 },
        { categoryId: 'cat-4', amount: 20 },
        { categoryId: 'cat-5', amount: 10 },
        { categoryId: 'cat-6', amount: 10 }
      ],
      amount: 100,
      type: 'expense',
      categoriesById
    })).toThrow(expect.objectContaining({ statusCode: 422, payload: expect.objectContaining({ message: ERROR_MESSAGE.TRANSACTION.SPLIT_MAX }) }))
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

  it('accepts the same category appearing in two lines', () => {
    expect(() => assertSplitLines({
      lines: [{ categoryId: 'cat-expense', amount: 60 }, { categoryId: 'cat-expense', amount: 40 }],
      amount: 100,
      type: 'expense',
      categoriesById
    })).not.toThrow()
  })

  it('reports a missing category as not found rather than as a type mismatch', () => {
    expect(() => assertSplitLines({
      lines: [{ categoryId: 'cat-expense', amount: 60 }, { categoryId: 'missing', amount: 40 }],
      amount: 100,
      type: 'expense',
      categoriesById
    })).toThrow(expect.objectContaining({ statusCode: 404, payload: expect.objectContaining({ message: ERROR_MESSAGE.CATEGORY.NOT_FOUND }) }))
  })

  it('accepts valid lines matching the amount and type', () => {
    expect(() => assertSplitLines({
      lines: [{ categoryId: 'cat-expense', amount: 60 }, { categoryId: 'cat-expense-2', amount: 40 }],
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

  it('loads categories across multiple chunks when count exceeds 500', () => {
    const chunkIds = Array.from({ length: 502 }, (_, index) => `id-${index}`)
    const result = loadCategoriesById(db, [categoryId, ...chunkIds], user)
    expect(result.size).toBe(1)
    expect(result.get(categoryId)).toEqual({ type: 'expense' })
  })
})

describe('assertSplitEditInvariant', () => {
  let db: DB
  let user: string
  let categoryA: string
  let categoryB: string
  let categoryC: string

  beforeAll(() => {
    db = createTestDb()
    user = generateUsername()
    db.insert(users).values({ id: generateId(), username: user, password: 'pwd', createdAt: new Date() }).run()
    categoryA = generateId()
    categoryB = generateId()
    categoryC = generateId()
    db.insert(categories).values([
      { id: categoryA, name: 'Cat A', type: 'expense', user },
      { id: categoryB, name: 'Cat B', type: 'expense', user },
      { id: categoryC, name: 'Cat C', type: 'expense', user }
    ]).run()
  })

  afterAll(() => closeTestDb(db))

  const existingSplits = [
    { categoryId: 'catA', amount: 60 },
    { categoryId: 'catB', amount: 40 }
  ]

  it('Scenario A: rejects partial amount update when splits are omitted and sum mismatches', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits,
      currentAmount: 100,
      currentType: 'expense',
      newAmount: 110,
      user,
      db
    })).toThrow(expect.objectContaining({ statusCode: 422, payload: expect.objectContaining({ message: ERROR_MESSAGE.TRANSACTION.SPLIT_SUM_MISMATCH }) }))
  })

  it('Scenario A: accepts partial amount update when new amount still matches existing splits sum', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits,
      currentAmount: 100,
      currentType: 'expense',
      newAmount: 100,
      user,
      db
    })).not.toThrow()
  })

  it('Scenario B: rejects partial category/tags change on a split transaction when splits are omitted', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits,
      currentAmount: 100,
      currentType: 'expense',
      hasNewCategoryOrTags: true,
      user,
      db
    })).toThrow(expect.objectContaining({ statusCode: 422, payload: expect.objectContaining({ message: ERROR_MESSAGE.TRANSACTION.SPLIT_FIELDS_REQUIRE_SPLITS }) }))
  })

  it('Scenario B: rejects partial type change on a split transaction when splits are omitted', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits,
      currentAmount: 100,
      currentType: 'expense',
      newType: 'income',
      user,
      db
    })).toThrow(expect.objectContaining({ statusCode: 422, payload: expect.objectContaining({ message: ERROR_MESSAGE.TRANSACTION.SPLIT_FIELDS_REQUIRE_SPLITS }) }))
  })

  it('Scenario B: allows category change on a non-split transaction when splits are omitted', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits: [],
      currentAmount: 100,
      currentType: 'expense',
      hasNewCategoryOrTags: true,
      user,
      db
    })).not.toThrow()
  })

  it('Scenario C: accepts new amount with new valid splits matching the amount', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits,
      currentAmount: 100,
      currentType: 'expense',
      newAmount: 110,
      newSplits: [
        { categoryId: categoryA, amount: 70 },
        { categoryId: categoryB, amount: 40 }
      ],
      user,
      db
    })).not.toThrow()
  })

  it('Scenario D: accepts explicitly empty splits array to transition split item to normal', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits,
      currentAmount: 100,
      currentType: 'expense',
      newSplits: [],
      user,
      db
    })).not.toThrow()
  })

  it('Scenario E: rejects new splits with exactly one split', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits,
      currentAmount: 100,
      currentType: 'expense',
      newSplits: [{ categoryId: categoryA, amount: 100 }],
      user,
      db
    })).toThrow(expect.objectContaining({ statusCode: 422, payload: expect.objectContaining({ message: ERROR_MESSAGE.TRANSACTION.SPLIT_MIN }) }))
  })

  it('allows editing non-split fields (like notes or date) without providing splits', () => {
    expect(() => assertSplitEditInvariant({
      existingSplits,
      currentAmount: 100,
      currentType: 'expense',
      user,
      db
    })).not.toThrow()
  })
})
