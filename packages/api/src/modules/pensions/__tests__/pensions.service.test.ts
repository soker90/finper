import Boom from '@hapi/boom'
import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createPensionsRepository } from '../pensions.repository'
import { PensionsService } from '../pensions.service'
import { generateUsername } from '../../../../test/generate-values'
import { ERROR_MESSAGE } from '../../../i18n'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

describe('Pensions Service', () => {
  let db: DB
  let repository: ReturnType<typeof createPensionsRepository>
  let service: PensionsService
  let user: string

  beforeAll(() => {
    db = createTestDb()
    repository = createPensionsRepository(db)
    service = new PensionsService(repository)
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


  describe('addPension', () => {
    it('should create and return the serialized pension', () => {
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

      const pension = service.addPension(data)

      expect(pension._id).toBeDefined()
      expect(pension.date).toBe(date)
      expect(pension.user).toBe(user)
      expect(pension.value).toBe(10)
    })
  })

  describe('getPensions', () => {
    it('should return zeros and empty array when no pensions exist', () => {
      const response = service.getPensions(user)
      
      expect(response).toEqual({
        amount: 0,
        units: 0,
        employeeAmount: 0,
        companyAmount: 0,
        total: 0,
        transactions: []
      })
    })

    it('should aggregate amounts correctly and order transactions by date desc', () => {
      const data = {
        employeeAmount: 100,
        employeeUnits: 10,
        companyAmount: 50,
        companyUnits: 5,
        user
      }
      
      // insert older
      service.addPension({ ...data, date: 1000, value: 10 })
      // insert newer
      service.addPension({ ...data, date: 2000, value: 15 })

      const response = service.getPensions(user)
      
      expect(response.transactions).toHaveLength(2)
      expect(response.transactions[0].date).toBe(2000)
      expect(response.transactions[1].date).toBe(1000)
      
      expect(response.employeeAmount).toBe(200) // 100 + 100
      expect(response.companyAmount).toBe(100) // 50 + 50
      expect(response.amount).toBe(300) // 200 + 100
      expect(response.units).toBe(30) // 15 + 15

      // total should be value of the latest (transactions[0]) * total units
      // latest value = 15, units = 30 -> 15 * 30 = 450
      expect(response.total).toBe(450)
    })
  })


})
