import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import testDatabase from '../../../../test/test-db'
import { mongoose } from '@soker90/finper-models'
import { dashboardRoutes } from '../dashboard.routes'

const { accounts, users } = schema
const dbInstance = testDatabase(mongoose)

describe('Dashboard Controller (Part B - GET /stats)', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/dashboard'

  beforeAll(async () => {
    await dbInstance.connect()
    server.app.use('/test-api/dashboard', dashboardRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
    sqliteDb.insert(accounts).values({ id: generateId(), name: 'Active', bank: 'B', balance: 1500, isActive: true, user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
    await dbInstance.close()
  })

  describe('GET /stats', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(`${base}/stats`).expect(401)
    })

    test('success returns the dashboard stats object', async () => {
      const res = await supertest(server.app).get(`${base}/stats`).set('Authorization', `Bearer ${token}`).expect(200)
      expect(res.body.totalBalance).toBe(1500)
      expect(res.body).toHaveProperty('netWorth')
      expect(res.body).toHaveProperty('healthScore')
      expect(res.body).toHaveProperty('insights')
      expect(res.body).toHaveProperty('expenseVelocity')
    })
  })
})
