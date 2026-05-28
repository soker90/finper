import { createTestDb } from '../../../../test/helpers/db'
import { createUsersRepository } from '../users.repository'
import { schema } from '@soker90/finper-db'

describe('users.repository', () => {
  let db: ReturnType<typeof createTestDb>
  let repo: ReturnType<typeof createUsersRepository>

  beforeAll(() => {
    db = createTestDb()
    repo = createUsersRepository(db)
  })

  afterEach(() => {
    db.delete(schema.users).run()
  })

  it('create and verify id generated', () => {
    const user = repo.create({ username: 'testuser', passwordHash: 'hash' })
    expect(user.id).toBeDefined()
    expect(user.username).toBe('testuser')
    expect(user.password).toBe('hash')
  })

  it('create with duplicate username throws constraint violation', () => {
    repo.create({ username: 'testuser', passwordHash: 'hash' })
    expect(() => {
      repo.create({ username: 'testuser', passwordHash: 'hash' })
    }).toThrow()
  })

  it('findByUsername with result', () => {
    repo.create({ username: 'testuser', passwordHash: 'hash' })
    const user = repo.findByUsername('testuser')
    expect(user).not.toBeNull()
    expect(user?.username).toBe('testuser')
  })

  it('findByUsername without result', () => {
    const user = repo.findByUsername('nope')
    expect(user).toBeNull()
  })

  it('existsByUsername with result', () => {
    repo.create({ username: 'testuser', passwordHash: 'hash' })
    expect(repo.existsByUsername('testuser')).toBe(true)
  })

  it('existsByUsername without result', () => {
    expect(repo.existsByUsername('nope')).toBe(false)
  })
})
