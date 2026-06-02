import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createCategoriesRepository } from '../categories.repository'
import { CategoriesService } from '../categories.service'
import { generateUsername } from '../../../../test/generate-values'
import { ERROR_MESSAGE } from '../../../i18n'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

describe('Categories Service', () => {
  let db: DB
  let repository: ReturnType<typeof createCategoriesRepository>
  let service: CategoriesService
  let user: string

  beforeAll(() => {
    db = createTestDb()
    repository = createCategoriesRepository(db)
    service = new CategoriesService(repository)
    user = generateUsername()
    db.insert(schema.users).values({ id: 'cat-svc-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
  })

  afterAll(() => {
    db.delete(schema.users).where(eq(schema.users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(schema.categories).where(eq(schema.categories.user, user)).run()
  })

  describe('getCategories', () => {
    it('should return an empty array when there are no categories', () => {
      expect(service.getCategories(user)).toEqual([])
    })

    it('should serialize with the snapshot shape (no user, parent only when present)', () => {
      const root = repository.create({ name: 'Root', type: 'expense', user })
      repository.create({ name: 'Child', type: 'expense', user, parentId: root.id })

      const result = service.getCategories(user)
      const serializedRoot = result.find(c => c._id === root.id)
      const serializedChild = result.find(c => c.name === 'Child')

      expect(serializedRoot).toEqual({ _id: root.id, name: 'Root', type: 'expense', budgetRuleClass: 'none' })
      expect(serializedChild).toMatchObject({ name: 'Child', parent: { _id: root.id } })
      expect((serializedRoot as any).user).toBeUndefined()
    })
  })

  describe('getGroupedCategories', () => {
    it('should return an empty array when there are no root categories', () => {
      expect(service.getGroupedCategories(user)).toEqual([])
    })

    it('should return root categories with their children', () => {
      const root = repository.create({ name: 'Root', type: 'expense', user })
      repository.create({ name: 'Child', type: 'expense', user, parentId: root.id })

      const grouped = service.getGroupedCategories(user)
      const found = grouped.find(r => r._id === root.id)

      expect(found).toBeDefined()
      expect(found?.children).toEqual([{ _id: expect.any(String), name: 'Child' }])
    })
  })

  describe('addCategory', () => {
    it('should create a category without parent', () => {
      const result = service.addCategory({ body: { name: 'Food', type: 'expense' }, user })
      expect(result._id).toBeDefined()
      expect(result.name).toBe('Food')
      expect((result as any).parent).toBeUndefined()
    })

    it('should create a category with an existing parent', () => {
      const root = service.addCategory({ body: { name: 'Root', type: 'expense' }, user })
      const child = service.addCategory({ body: { name: 'Child', type: 'expense', parent: root._id }, user })
      expect(child.parent).toEqual({ _id: root._id })
    })

    it('should throw 404 PARENT_NOT_FOUND when the parent does not exist', () => {
      expect(() => service.addCategory({ body: { name: 'Child', type: 'expense', parent: '62a39498c4497e1fe3c2bf35' }, user }))
        .toThrow(expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND }) }))
    })
  })

  describe('editCategory', () => {
    it('should throw 400 when the id is not valid', () => {
      expect(() => service.editCategory({ id: 'not-valid', body: { name: 'X', type: 'expense' }, user }))
        .toThrow(expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.COMMON.INVALID_ID }) }))
    })

    it('should throw 404 when the category does not exist', () => {
      expect(() => service.editCategory({ id: '62a39498c4497e1fe3c2bf35', body: { name: 'X', type: 'expense' }, user }))
        .toThrow(expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.CATEGORY.NOT_FOUND }) }))
    })

    it('should update the category and return it serialized', () => {
      const created = repository.create({ name: 'Old', type: 'expense', user })
      const updated = service.editCategory({ id: created.id, body: { name: 'New', type: 'income' }, user })
      expect(updated.name).toBe('New')
      expect(updated.type).toBe('income')
    })

    it('should throw 404 PARENT_NOT_FOUND when the new parent does not exist', () => {
      const created = repository.create({ name: 'Old', type: 'expense', user })
      expect(() => service.editCategory({ id: created.id, body: { name: 'New', type: 'expense', parent: '62a39498c4497e1fe3c2bf35' }, user }))
        .toThrow(expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND }) }))
    })
  })

  describe('deleteCategory', () => {
    it('should throw 400 when the id is not valid', () => {
      expect(() => service.deleteCategory({ id: 'not-valid', user }))
        .toThrow(expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.COMMON.INVALID_ID }) }))
    })

    it('should throw 404 when the category does not exist', () => {
      expect(() => service.deleteCategory({ id: '62a39498c4497e1fe3c2bf35', user }))
        .toThrow(expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.CATEGORY.NOT_FOUND }) }))
    })

    // CASO NUEVO (opción C): no se puede borrar un padre con hijas.
    it('should throw 409 HAS_CHILDREN when the category is a parent', () => {
      const root = repository.create({ name: 'Root', type: 'expense', user })
      repository.create({ name: 'Child', type: 'expense', user, parentId: root.id })

      expect(() => service.deleteCategory({ id: root.id, user }))
        .toThrow(expect.objectContaining({ payload: expect.objectContaining({ message: ERROR_MESSAGE.CATEGORY.HAS_CHILDREN }) }))
    })

    it('should delete a category with no children', () => {
      const leaf = repository.create({ name: 'Leaf', type: 'expense', user })
      service.deleteCategory({ id: leaf.id, user })
      expect(repository.findById(leaf.id, user)).toBeUndefined()
    })
  })
})
