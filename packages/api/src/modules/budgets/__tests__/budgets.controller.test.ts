import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { budgetsRoutes } from '../budgets.routes'

const { budgets, categories, users } = schema

describe('Budgets Controller (Part A)', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/budgets'
  let categoryId: string

  beforeAll(async () => {
    server.app.use('/test-api/budgets', budgetsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Luz', type: 'expense', budgetRuleClass: 'none', user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(budgets).where(eq(budgets.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(budgets).where(eq(budgets.user, username)).run()
  })

  describe('PATCH /:category/:year/:month', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).patch(`${base}/${categoryId}/2025/3`).expect(401)
    })

    test('non-existent category responds 404', async () => {
      await supertest(server.app).patch(`${base}/62a39498c4497e1fe3c2bf35/2025/3`).set('Authorization', `Bearer ${token}`)
        .send({ amount: 120 }).expect(404)
    })

    test('success upserts the budget and responds 200', async () => {
      const res = await supertest(server.app).patch(`${base}/${categoryId}/2025/3`).set('Authorization', `Bearer ${token}`)
        .send({ amount: 120 }).expect(200)
      expect(res.body.amount).toBe(120)
      expect(sqliteDb.select().from(budgets).where(eq(budgets.user, username)).all()).toHaveLength(1)
    })
  })

  describe('POST / (copy)', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).post(base).expect(401)
    })

    test('copy with no origin budgets responds success:false', async () => {
      const res = await supertest(server.app).post(base).set('Authorization', `Bearer ${token}`)
        .send({ year: 2025, month: 5, yearOrigin: 2025, monthOrigin: 4 }).expect(200)
      expect(res.body.success).toBe(false)
    })

    test('copy with origin budgets responds success:true and creates destination budgets', async () => {
      await supertest(server.app).patch(`${base}/${categoryId}/2025/4`).set('Authorization', `Bearer ${token}`)
        .send({ amount: 80 }).expect(200)
      const res = await supertest(server.app).post(base).set('Authorization', `Bearer ${token}`)
        .send({ year: 2025, month: 5, yearOrigin: 2025, monthOrigin: 4 }).expect(200)
      expect(res.body.success).toBe(true)
      const dest = sqliteDb.select().from(budgets).where(eq(budgets.month, 5)).all()
      expect(dest.find(b => b.user === username)?.amount).toBe(80)
    })
  })
})
