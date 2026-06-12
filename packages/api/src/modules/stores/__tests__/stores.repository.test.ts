import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createStoresRepository } from '../stores.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

describe('Stores Repository', () => {
  let db: DB
  let repository: ReturnType<typeof createStoresRepository>
  let user: string

  beforeAll(() => {
    db = createTestDb()
    repository = createStoresRepository(db)
    user = generateUsername()
    db.insert(schema.users).values({ id: 'store-repo-user', username: user, password: 'pwd', createdAt: new Date() }).run()
  })

  afterAll(() => {
    db.delete(schema.users).where(eq(schema.users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(schema.stores).where(eq(schema.stores.user, user)).run()
  })

  it('should return only stores belonging to the given user', () => {
    const other = generateUsername()
    db.insert(schema.users).values({ id: 'store-repo-other', username: other, password: 'pwd', createdAt: new Date() }).run()
    repository.create({ name: 'Mine', user })
    repository.create({ name: 'Theirs', user: other })

    const result = repository.findByUser(user)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Mine')

    db.delete(schema.stores).where(eq(schema.stores.user, other)).run()
    db.delete(schema.users).where(eq(schema.users.username, other)).run()
  })
})
