import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createPensionsRepository } from '../pensions.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

describe('Pensions Repository', () => {
  let db: DB
  let repository: ReturnType<typeof createPensionsRepository>
  let user: string

  beforeAll(() => {
    db = createTestDb()
    repository = createPensionsRepository(db)
    user = generateUsername()
    db.insert(schema.users).values({ id: 'some-id', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
  })

  afterAll(() => {
    db.delete(schema.users).where(eq(schema.users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(schema.pensions).where(eq(schema.pensions.user, user)).run()
  })

  describe('create', () => {
    it('should create a pension and return it with an id', () => {
      const date = Date.now()
      const data = {
        date,
        employeeAmount: 100,
        employeeUnits: 10,
        companyAmount: 100,
        companyUnits: 10,
        value: 10,
        user
      }

      const pension = repository.create(data)

      expect(pension.id).toBeDefined()
      expect(pension.date.getTime()).toBe(date)
      expect(pension.user).toBe(user)
    })
  })

  describe('findByUser', () => {
    it('should return empty array when no pensions exist for user', () => {
      const pensions = repository.findByUser(user)
      expect(pensions).toHaveLength(0)
    })

    it('should return pensions ordered by date descending', () => {
      const data = {
        employeeAmount: 100,
        employeeUnits: 10,
        companyAmount: 100,
        companyUnits: 10,
        value: 10,
        user
      }
      repository.create({ ...data, date: 1000 })
      repository.create({ ...data, date: 3000 })
      repository.create({ ...data, date: 2000 })

      const pensions = repository.findByUser(user)

      expect(pensions).toHaveLength(3)
      expect(pensions[0].date.getTime()).toBe(3000)
      expect(pensions[1].date.getTime()).toBe(2000)
      expect(pensions[2].date.getTime()).toBe(1000)
    })
  })

  describe('findById', () => {
    it('should return undefined when pension does not exist', () => {
      expect(repository.findById('non-existent', user)).toBeUndefined()
    })

    it('should return undefined when pension exists but belongs to another user', () => {
      const data = {
        date: 1000,
        employeeAmount: 100,
        employeeUnits: 10,
        companyAmount: 100,
        companyUnits: 10,
        value: 10,
        user
      }
      const pension = repository.create(data)

      expect(repository.findById(pension.id, 'other-user')).toBeUndefined()
    })

    it('should return the pension when it exists and belongs to user', () => {
      const data = {
        date: 1000,
        employeeAmount: 100,
        employeeUnits: 10,
        companyAmount: 100,
        companyUnits: 10,
        value: 10,
        user
      }
      const pension = repository.create(data)

      const found = repository.findById(pension.id, user)
      expect(found).toBeDefined()
      expect(found?.id).toBe(pension.id)
    })
  })

  describe('update', () => {
    it('should return undefined when pension does not exist', () => {
      expect(repository.update('non-existent', user, { value: 20 })).toBeUndefined()
    })

    it('should update the pension and return the updated data', () => {
      const data = {
        date: 1000,
        employeeAmount: 100,
        employeeUnits: 10,
        companyAmount: 100,
        companyUnits: 10,
        value: 10,
        user
      }
      const pension = repository.create(data)

      const updated = repository.update(pension.id, user, { value: 20, employeeAmount: 200 })

      expect(updated).toBeDefined()
      expect(updated?.id).toBe(pension.id)
      expect(updated?.value).toBe(20)
      expect(updated?.employeeAmount).toBe(200)
      expect(updated?.date?.getTime()).toBe(1000)
    })
  })
})
