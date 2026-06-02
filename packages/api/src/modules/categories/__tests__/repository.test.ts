import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createCategoriesRepository } from '../categories.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

describe('Categories Repository', () => {
  let db: DB
  let repository: ReturnType<typeof createCategoriesRepository>
  let user: string

  beforeAll(() => {
    db = createTestDb()
    repository = createCategoriesRepository(db)
    user = generateUsername()
    db.insert(schema.users).values({ id: 'cat-repo-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
  })

  afterAll(() => {
    db.delete(schema.users).where(eq(schema.users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(schema.categories).where(eq(schema.categories.user, user)).run()
  })

  describe('create', () => {
    it('should create a category and return it with an id', () => {
      const category = repository.create({ name: 'Food', type: 'expense', user })

      expect(category.id).toBeDefined()
      expect(category.name).toBe('Food')
      expect(category.type).toBe('expense')
      expect(category.user).toBe(user)
      expect(category.parentId).toBeNull()
      expect(category.budgetRuleClass).toBe('none')
    })

    it('should create a category with a parentId', () => {
      const root = repository.create({ name: 'Root', type: 'expense', user })
      const child = repository.create({ name: 'Child', type: 'expense', user, parentId: root.id })

      expect(child.parentId).toBe(root.id)
    })
  })

  describe('findByUser', () => {
    it('should return an empty array when the user has no categories', () => {
      expect(repository.findByUser(user)).toEqual([])
    })

    it('should return only categories belonging to the given user', () => {
      const other = generateUsername()
      db.insert(schema.users).values({ id: 'cat-repo-other', username: other, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
      repository.create({ name: 'Mine', type: 'expense', user })
      repository.create({ name: 'Theirs', type: 'expense', user: other })

      const result = repository.findByUser(user)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Mine')

      db.delete(schema.categories).where(eq(schema.categories.user, other)).run()
      db.delete(schema.users).where(eq(schema.users.username, other)).run()
    })

    it('should return categories sorted by name', () => {
      repository.create({ name: 'Ccc', type: 'expense', user })
      repository.create({ name: 'Aaa', type: 'expense', user })
      repository.create({ name: 'Bbb', type: 'expense', user })

      const names = repository.findByUser(user).map(c => c.name)
      expect(names).toEqual(['Aaa', 'Bbb', 'Ccc'])
    })
  })

  describe('findById', () => {
    it('should return the category when it exists for the user', () => {
      const created = repository.create({ name: 'Food', type: 'expense', user })
      const found = repository.findById(created.id, user)
      expect(found?.id).toBe(created.id)
    })

    it('should return undefined when it does not exist', () => {
      expect(repository.findById('62a39498c4497e1fe3c2bf35', user)).toBeUndefined()
    })

    it('should return undefined when it belongs to another user', () => {
      const created = repository.create({ name: 'Food', type: 'expense', user })
      expect(repository.findById(created.id, generateUsername())).toBeUndefined()
    })
  })

  describe('hasChildren', () => {
    it('should return true when the category is a parent of another', () => {
      const root = repository.create({ name: 'Root', type: 'expense', user })
      repository.create({ name: 'Child', type: 'expense', user, parentId: root.id })
      expect(repository.hasChildren(root.id)).toBe(true)
    })

    it('should return false when the category has no children', () => {
      const leaf = repository.create({ name: 'Leaf', type: 'expense', user })
      expect(repository.hasChildren(leaf.id)).toBe(false)
    })
  })

  describe('update', () => {
    it('should update the category and return the updated row', () => {
      const created = repository.create({ name: 'Old', type: 'expense', user })
      const updated = repository.update(created.id, user, { name: 'New', type: 'income' })
      expect(updated?.name).toBe('New')
      expect(updated?.type).toBe('income')
    })

    it('should return undefined when updating a category of another user', () => {
      const created = repository.create({ name: 'Old', type: 'expense', user })
      expect(repository.update(created.id, generateUsername(), { name: 'X', type: 'expense' })).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('should delete the category and return it', () => {
      const created = repository.create({ name: 'Food', type: 'expense', user })
      const deleted = repository.delete(created.id, user)
      expect(deleted?.id).toBe(created.id)
      expect(repository.findById(created.id, user)).toBeUndefined()
    })

    it('should return undefined when deleting a non-existent category', () => {
      expect(repository.delete('62a39498c4497e1fe3c2bf35', user)).toBeUndefined()
    })
  })
})
