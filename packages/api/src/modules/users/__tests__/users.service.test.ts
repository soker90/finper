import { createTestDb } from '../../../../test/helpers/db'
import { createUsersRepository } from '../users.repository'
import { createUsersService } from '../users.service'
import { schema } from '@soker90/finper-db'

describe('users.service', () => {
  let db: ReturnType<typeof createTestDb>
  let repo: ReturnType<typeof createUsersRepository>
  let service: ReturnType<typeof createUsersService>

  beforeAll(() => {
    db = createTestDb()
    repo = createUsersRepository(db)
    service = createUsersService(repo)
  })

  afterEach(() => {
    db.delete(schema.users).run()
  })

  // Unit: the password is stored hashed, which is not observable through the HTTP client.
  it('persists the password hashed, not in plain text', async () => {
    const created = await service.createUser({ username: 'testuser', password: 'password123' })
    expect(created.username).toBe('testuser')
    expect(created._id).toBeDefined()

    const user = repo.findByUsername('testuser')
    expect(user).toBeDefined()
    expect(user?.password).not.toBe('password123')
  })
})
