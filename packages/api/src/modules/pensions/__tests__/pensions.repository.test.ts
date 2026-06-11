import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createPensionsRepository } from '../pensions.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

// El CRUD (create/find/update + scope por usuario) está cubierto vía endpoint en
// `pensions.controller.test.ts`. Aquí solo se conserva el orden por fecha
// descendente, que el endpoint GET no asercia (inserta una sola pensión).
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
    expect(pensions[0].date).toBe(3000)
    expect(pensions[1].date).toBe(2000)
    expect(pensions[2].date).toBe(1000)
  })
})
