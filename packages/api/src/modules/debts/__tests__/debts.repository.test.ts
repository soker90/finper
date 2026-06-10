import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createDebtsRepository } from '../debts.repository'
import { schema, generateId } from '@soker90/finper-db'
import type { DB } from '@soker90/finper-db'

const { users } = schema

describe('debtsRepository', () => {
  let db: DB
  let repo: ReturnType<typeof createDebtsRepository>
  const username = 'testuser'

  beforeEach(() => {
    db = createTestDb()
    repo = createDebtsRepository(db)
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
    it('returns empty array when user has no debts', () => {
      expect(repo.findAllByUser(username)).toEqual([])
    })

    it('returns only debts of the given user', () => {
      db.insert(users).values({
        id: generateId(),
        username: 'other',
        password: 'pwd-hash',
        createdAt: new Date()
      }).run()
      repo.create(username, { from: 'Alice', amount: 100, type: 'to', date: Date.now() })
      repo.create('other', { from: 'Bob', amount: 50, type: 'to', date: Date.now() })

      const result = repo.findAllByUser(username)
      expect(result).toHaveLength(1)
      expect(result[0].from).toBe('Alice')
    })
  })

  describe('create', () => {
    it('creates a debt with generated id (24-char hex)', () => {
      const debt = repo.create(username, { from: 'Charlie', amount: 200, type: 'from', date: Date.now() })
      expect(debt.id).toMatch(/^[0-9a-f]{24}$/)
      expect(debt.from).toBe('Charlie')
    })
  })

  describe('findById', () => {
    it('finds debt by id and user', () => {
      const created = repo.create(username, { from: 'Dave', amount: 10, type: 'to', date: Date.now() })
      const found = repo.findById(created.id, username)
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('returns null when debt belongs to another user', () => {
      db.insert(users).values({
        id: generateId(),
        username: 'other',
        password: 'pwd',
        createdAt: new Date()
      }).run()
      const created = repo.create('other', { from: 'Dave', amount: 10, type: 'to', date: Date.now() })
      expect(repo.findById(created.id, username)).toBeNull()
    })
  })
})
