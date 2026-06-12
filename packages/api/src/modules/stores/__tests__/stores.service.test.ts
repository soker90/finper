import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createStoresRepository } from '../stores.repository'
import { StoresService } from '../stores.service'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

describe('Stores Service', () => {
  let db: DB
  let repository: ReturnType<typeof createStoresRepository>
  let service: StoresService
  let user: string

  beforeAll(() => {
    db = createTestDb()
    repository = createStoresRepository(db)
    service = new StoresService(repository)
    user = generateUsername()
    db.insert(schema.users).values({ id: 'store-svc-user', username: user, password: 'pwd', createdAt: new Date() }).run()
  })

  afterAll(() => {
    db.delete(schema.users).where(eq(schema.users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(schema.stores).where(eq(schema.stores.user, user)).run()
  })

  describe('getAndReplaceStore', () => {
    // Unit: fine-grained comparison logic (spanishCompare) not worth driving over HTTP.
    it('should reuse the store ignoring case and accents (sensitivity base)', async () => {
      service.getAndReplaceStore({ store: 'Mercadona', user })
      service.getAndReplaceStore({ store: 'MERCADÓNA', user })
      const stores = repository.findByUser(user)
      expect(stores).toHaveLength(1)
      // keeps the original name
      expect(stores[0].name).toBe('Mercadona')
    })

    // Unit: the "no store" branch leaves the transaction untouched.
    it('should leave the transaction untouched when it has no store', async () => {
      const tx = service.getAndReplaceStore({ user })
      expect(tx.store).toBeUndefined()
      expect(repository.findByUser(user)).toHaveLength(0)
    })
  })
})
