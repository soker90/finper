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
