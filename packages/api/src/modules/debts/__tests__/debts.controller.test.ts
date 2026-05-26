import supertest from 'supertest'
import { eq } from 'drizzle-orm'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { debtsRepository } from '../debts.repository'
import { mongoose } from '@soker90/finper-models'
import { schema, generateId } from '@soker90/finper-db'
import testDatabase from '../../../../test/test-db'

const { users, debts } = schema
const dbInstance = testDatabase(mongoose)

describe('debtsController', () => {
  let token: string
  const username = generateUsername()
  const userId = generateId()

  beforeAll(async () => {
    await dbInstance.connect()
    sqliteDb.insert(users).values({
      id: userId,
      username,
      password: 'pwd-hash',
      createdAt: new Date(),
    }).run()
    token = await requestLogin(server.app, { username })
  })

  afterAll(async () => {
    sqliteDb.delete(users).where(eq(users.id, userId)).run()
    await dbInstance.close()
  })

  afterEach(() => {
    sqliteDb.delete(debts).run()
  })

  describe('GET /api/debts', () => {
    it('should return 200 with debts list', async () => {
      await debtsRepository.create(username, { from: 'Alice', amount: 100, type: 'to' })

      const response = await supertest(server.app)
        .get('/api/debts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('to')
      expect(response.body).toHaveProperty('from')
      expect(response.body).toHaveProperty('debtsByPerson')
      expect(response.body.to).toHaveLength(1)
      expect(response.body.to[0].from).toBe('Alice')
    })
  })

  describe('POST /api/debts', () => {
    it('should create a debt and return 201', async () => {
      const response = await supertest(server.app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${token}`)
        .send({ from: 'Bob', amount: 50, type: 'from' })
        .expect(201)

      expect(response.body.from).toBe('Bob')
      expect(response.body.amount).toBe(50)
      expect(response.body._id).toMatch(/^[0-9a-f]{24}$/)
    })
  })
})
