import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { dashboardRoutes } from '../dashboard.routes'

const { accounts, users, pensions, pensionPlans } = schema

describe('Dashboard Controller (Part B - GET /stats)', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/dashboard'

  beforeAll(async () => {
    server.app.use('/test-api/dashboard', dashboardRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
    sqliteDb.insert(accounts).values({ id: generateId(), name: 'Active', bank: 'B', balance: 1500, isActive: true, user: username }).run()
  })

  afterEach(() => {
    sqliteDb.delete(pensions).where(eq(pensions.user, username)).run()
    sqliteDb.delete(pensionPlans).where(eq(pensionPlans.user, username)).run()
  })

  afterAll(async () => {
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
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

    test('aggregates pension total per plan instead of mixing unit values across plans', async () => {
      const auth = { type: 'bearer' as const }
      const planA = await supertest(server.app).post('/api/pension-plans').auth(token, auth).send({ name: 'Plan A', color: '#4CAF50' }).expect(201)
      const planB = await supertest(server.app).post('/api/pension-plans').auth(token, auth).send({ name: 'Plan B', color: '#4CAF50' }).expect(201)

      // Plan A: 10 units at value 10 -> total 100
      await supertest(server.app).post(`/api/pension-plans/${planA.body.id}/movements`).auth(token, auth).send({
        date: 1000, employeeAmount: 100, employeeUnits: 10, companyAmount: 0, companyUnits: 0, value: 10
      }).expect(201)

      // Plan B: 10 units at value 20, more recent than plan A -> total 200
      await supertest(server.app).post(`/api/pension-plans/${planB.body.id}/movements`).auth(token, auth).send({
        date: 2000, employeeAmount: 200, employeeUnits: 10, companyAmount: 0, companyUnits: 0, value: 20
      }).expect(201)

      const res = await supertest(server.app).get(`${base}/stats`).set('Authorization', `Bearer ${token}`).expect(200)

      // A naive aggregate that ignores plan boundaries would use the most
      // recent movement's value (20) against the combined units (20) and
      // return 400 instead of the correct per-plan sum (100 + 200 = 300).
      expect(res.body.pension.total).toBe(300)
    })
  })
})
