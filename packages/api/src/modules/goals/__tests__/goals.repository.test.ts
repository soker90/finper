import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createGoalsRepository } from '../goals.repository'
import { schema, generateId } from '@soker90/finper-db'
import type { DB } from '@soker90/finper-db'

const { users } = schema

describe('goalsRepository', () => {
  let db: DB
  let repo: ReturnType<typeof createGoalsRepository>
  const username = 'testuser'

  beforeEach(() => {
    db = createTestDb()
    repo = createGoalsRepository(db)
    db.insert(users).values({
      id: generateId(),
      username,
      password: 'pwd-hash',
      createdAt: new Date()
    }).run()
  })

  afterEach(() => {
    closeTestDb(db)
  })

  describe('findAllByUser', () => {
    it('returns empty array when user has no goals', () => {
      expect(repo.findAllByUser(username)).toEqual([])
    })

    it('returns goals for the user', () => {
      repo.create(username, {
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 0,
        deadline: Date.now(),
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })
      const result = repo.findAllByUser(username)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Goal 1')
    })
  })

  describe('findById', () => {
    it('returns null if not found', () => {
      expect(repo.findById('non-existent', username)).toBeNull()
    })

    it('returns null if belongs to another user', () => {
      const created = repo.create(username, {
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 0,
        deadline: Date.now(),
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })
      expect(repo.findById(created.id, 'other-user')).toBeNull()
    })

    it('returns the goal if found and belongs to user', () => {
      const created = repo.create(username, {
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 0,
        deadline: null,
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })
      const result = repo.findById(created.id, username)
      expect(result).not.toBeNull()
      expect(result?.id).toBe(created.id)
    })
  })

  describe('create', () => {
    it('creates a goal and generates valid hex id', () => {
      const created = repo.create(username, {
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 0,
        deadline: null,
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })
      expect(created.id).toMatch(/^[0-9a-f]{24}$/)
      expect(created.name).toBe('Goal 1')
      expect(created.user).toBe(username)

      const found = repo.findById(created.id, username)
      expect(found).not.toBeNull()
    })
  })

  describe('update', () => {
    it('updates only specified fields', () => {
      const created = repo.create(username, {
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 0,
        deadline: null,
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })

      const updated = repo.update(created.id, username, { name: 'Updated Goal' })
      expect(updated?.name).toBe('Updated Goal')
      expect(updated?.targetAmount).toBe(1000) // unchanged

      const found = repo.findById(created.id, username)
      expect(found?.name).toBe('Updated Goal')
    })
  })

  describe('delete', () => {
    it('deletes goal and returns true', () => {
      const created = repo.create(username, {
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 0,
        deadline: null,
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })

      const result = repo.delete(created.id, username)
      expect(result).toBe(true)

      const found = repo.findById(created.id, username)
      expect(found).toBeNull()
    })

    it('returns false if goal does not exist', () => {
      const result = repo.delete('non-existent', username)
      expect(result).toBe(false)
    })
  })

  describe('getTotalAllocatedByUser', () => {
    it('returns sum of all currentAmounts', () => {
      repo.create(username, {
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 150,
        deadline: null,
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })
      repo.create(username, {
        name: 'Goal 2',
        targetAmount: 1000,
        currentAmount: 300,
        deadline: null,
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })
      expect(repo.getTotalAllocatedByUser(username)).toBe(450)
    })

    it('returns 0 if no goals', () => {
      expect(repo.getTotalAllocatedByUser(username)).toBe(0)
    })

    it('excludes specified goal id', () => {
      const g1 = repo.create(username, {
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 150,
        deadline: null,
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })
      const g2 = repo.create(username, {
        name: 'Goal 2',
        targetAmount: 1000,
        currentAmount: 300,
        deadline: null,
        color: '#4CAF50',
        icon: 'DollarOutlined'
      })

      expect(repo.getTotalAllocatedByUser(username, g1.id)).toBe(300)
      expect(repo.getTotalAllocatedByUser(username, g2.id)).toBe(150)
    })
  })
})
