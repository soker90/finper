import { CategoryModel, mongoose, TRANSACTION } from '@soker90/finper-models'
import { faker } from '@faker-js/faker'
import CategoryService from '../../src/services/category.service'
import { insertCategory } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('CategoryService', () => {
  const service = new CategoryService()

  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())
  afterEach(() => CategoryModel.deleteMany({}))

  // ── getCategories ─────────────────────────────────────────────────────────
  describe('getCategories', () => {
    test('returns empty array when user has no categories', async () => {
      const result = await service.getCategories(generateUsername())
      expect(result).toEqual([])
    })

    test('returns only categories belonging to the given user', async () => {
      const user = generateUsername()
      // root:true → crea solo 1 categoría (sin padre)
      await insertCategory({ user, root: true })
      await insertCategory({ user: generateUsername() }) // otro usuario

      const result = await service.getCategories(user)
      expect(result).toHaveLength(1)
    })

    test('returned documents include _id, name and type', async () => {
      const user = generateUsername()
      await insertCategory({ user })

      const [cat] = await service.getCategories(user)
      expect(cat).toHaveProperty('_id')
      expect(cat).toHaveProperty('name')
      expect(cat).toHaveProperty('type')
    })

    test('categories are sorted by name', async () => {
      const user = generateUsername()
      await insertCategory({ user, name: 'Zeta', root: true })
      await insertCategory({ user, name: 'Alpha', root: true })

      const result = await service.getCategories(user)
      const names = result.map((c: any) => c.name)
      expect(names).toEqual([...names].sort())
    })
  })

  // ── getGroupedCategories ──────────────────────────────────────────────────
  describe('getGroupedCategories', () => {
    test('returns empty array when there are no root categories', async () => {
      const result = await service.getGroupedCategories()
      expect(result).toEqual([])
    })

    test('root categories contain their children in the children array', async () => {
      const user = generateUsername()
      // insertCategory sin `root:true` crea internamente: 1 padre + 1 hijo
      const child = await insertCategory({ user })
      const rootId = (child as any).parent._id.toString()

      const result = await service.getGroupedCategories()
      const found = result.find((r: any) => r._id.toString() === rootId)
      expect(found).toBeDefined()
      expect(Array.isArray(found.children)).toBe(true)
      expect(found.children).toHaveLength(1)
    })
  })

  // ── addCategory ───────────────────────────────────────────────────────────
  describe('addCategory', () => {
    test('persists and returns the new category', async () => {
      const user = generateUsername()
      const name = faker.commerce.department()
      const type = TRANSACTION.Expense

      const created = await service.addCategory({ name, type, user } as any)
      expect(created.name).toBe(name)
      expect(created.type).toBe(type)
      expect(created.user).toBe(user)

      const inDb = await CategoryModel.findById(created._id)
      expect(inDb).not.toBeNull()
    })
  })

  // ── editCategory ──────────────────────────────────────────────────────────
  describe('editCategory', () => {
    test('updates the category and returns the updated document', async () => {
      const user = generateUsername()
      const category = await insertCategory({ user })
      const newName = faker.commerce.department()

      const updated = await service.editCategory({
        id: category._id.toString(),
        value: { name: newName, type: TRANSACTION.Income, user } as any
      })

      expect(updated.name).toBe(newName)
      expect(updated._id.toString()).toBe(category._id.toString())
    })
  })

  // ── deleteCategory ────────────────────────────────────────────────────────
  describe('deleteCategory', () => {
    test('removes the document from the collection', async () => {
      const user = generateUsername()
      const category = await insertCategory({ user })

      await service.deleteCategory({ id: category._id.toString() })

      const inDb = await CategoryModel.findById(category._id)
      expect(inDb).toBeNull()
    })
  })
})
