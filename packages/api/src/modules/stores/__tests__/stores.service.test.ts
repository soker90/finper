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
    db.insert(schema.users).values({ id: 'store-svc-user', username: user, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
  })

  afterAll(() => {
    db.delete(schema.users).where(eq(schema.users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(schema.stores).where(eq(schema.stores.user, user)).run()
  })

  describe('getStores', () => {
    it('should return an empty array when there are no stores', () => {
      expect(service.getStores(user)).toEqual([])
    })

    it('should serialize stores as { _id, name } without user', () => {
      const created = repository.create({ name: 'Mercadona', user })
      const result = service.getStores(user)
      expect(result).toEqual([{ _id: created.id, name: 'Mercadona' }])
      expect((result[0] as any).user).toBeUndefined()
    })
  })

  describe('getAndReplaceStore', () => {
    it('should create a new store and replace the name with its id', async () => {
      const tx = service.getAndReplaceStore({ store: 'Mercadona', user })
      const stores = repository.findByUser(user)
      expect(stores).toHaveLength(1)
      expect(tx.store).toBe(stores[0].id)
    })

    it('should reuse an existing store with the same name (no duplicate)', async () => {
      service.getAndReplaceStore({ store: 'Mercadona', user })
      service.getAndReplaceStore({ store: 'Mercadona', user })
      expect(repository.findByUser(user)).toHaveLength(1)
    })

    it('should reuse the store ignoring case and accents (sensitivity base)', async () => {
      service.getAndReplaceStore({ store: 'Mercadona', user })
      service.getAndReplaceStore({ store: 'MERCADÓNA', user })
      const stores = repository.findByUser(user)
      expect(stores).toHaveLength(1)
      // mantiene el name original
      expect(stores[0].name).toBe('Mercadona')
    })

    it('should leave the transaction untouched when it has no store', async () => {
      const tx = service.getAndReplaceStore({ user })
      expect(tx.store).toBeUndefined()
      expect(repository.findByUser(user)).toHaveLength(0)
    })
  })

  describe('replaceShopValue', () => {
    it('should apply getAndReplaceStore to value', () => {
      const result = service.replaceShopValue({ value: { store: 'Mercadona', user } })
      const stores = repository.findByUser(user)
      expect(result.value.store).toBe(stores[0].id)
    })
  })
})
