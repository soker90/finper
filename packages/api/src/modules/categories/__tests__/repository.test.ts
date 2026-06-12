import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createCategoriesRepository } from '../categories.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

// El CRUD (create/find/update/delete/hasChildren) está cubierto vía endpoint en
// `controller.test.ts`. Aquí solo se conserva el orden alfabético, que el
// endpoint GET no asercia y es responsabilidad de la capa de repositorio.
describe('Categories Repository', () => {
  let db: DB
  let repository: ReturnType<typeof createCategoriesRepository>
  let user: string

  beforeAll(() => {
    db = createTestDb()
    repository = createCategoriesRepository(db)
    user = generateUsername()
    db.insert(schema.users).values({ id: 'cat-repo-user', username: user, password: 'pwd', createdAt: new Date() }).run()
  })

  afterAll(() => {
    db.delete(schema.users).where(eq(schema.users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(schema.categories).where(eq(schema.categories.user, user)).run()
  })

  it('should return categories sorted by name', () => {
    repository.create({ name: 'Ccc', type: 'expense', user })
    repository.create({ name: 'Aaa', type: 'expense', user })
    repository.create({ name: 'Bbb', type: 'expense', user })

    const names = repository.findByUser(user).map(c => c.name)
    expect(names).toEqual(['Aaa', 'Bbb', 'Ccc'])
  })
})
