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

  it('createUser happy path', async () => {
    const created = await service.createUser({ username: 'testuser', password: 'password123' })
    expect(created.username).toBe('testuser')
    expect(created._id).toBeDefined()

    const user = repo.findByUsername('testuser')
    expect(user).toBeDefined()
    expect(user?.password).not.toBe('password123')
  })

  it('createUser with existing username throws conflict', async () => {
    await service.createUser({ username: 'testuser', password: 'password123' })
    try {
      await service.createUser({ username: 'testuser', password: 'password123' })
      fail('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(409)
      expect(err.payload.message).toBe('El usuario ya existe')
    }
  })

  it('validatePassword with correct and incorrect password', async () => {
    await service.createUser({ username: 'testuser', password: 'password123' })
    const user = repo.findByUsername('testuser')!
    
    expect(service.validatePassword('password123', user.password)).toBe(true)
    expect(service.validatePassword('wrong', user.password)).toBe(false)
  })

  it('signToken produces a decodable JWT with {username}', () => {
    const token = service.signToken('testuser')
    expect(typeof token).toBe('string')
    
    const jwt = require('jsonwebtoken')
    const decoded = jwt.decode(token)
    expect(decoded.username).toBe('testuser')
  })
})
