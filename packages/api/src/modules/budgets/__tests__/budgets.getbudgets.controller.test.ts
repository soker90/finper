import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { budgetsRoutes } from '../budgets.routes'

const { budgets, categories, users } = schema

describe('Budgets Controller (Part B - GET /)', () => {
  let token: string
  const username = generateUsername()
  const base = '/test-api/budgets'

  beforeAll(async () => {
    server.app.use('/test-api/budgets', budgetsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })

    const parent = generateId()
    sqliteDb.insert(categories).values({ id: parent, name: 'Casa', type: 'expense', budgetRuleClass: 'needs', user: username }).run()
    const child = generateId()
    sqliteDb.insert(categories).values({ id: child, name: 'Luz', type: 'expense', parentId: parent, budgetRuleClass: 'none', user: username }).run()
    sqliteDb.insert(budgets).values({ id: generateId(), year: 2025, month: 3, amount: 500, categoryId: child, user: username }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(budgets).where(eq(budgets.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  describe('GET /', () => {
    test('without token responds 401', async () => {
      await supertest(server.app).get(base).expect(401)
    })

    test('without year responds 422', async () => {
      await supertest(server.app).get(base).set('Authorization', `Bearer ${token}`).expect(422)
    })

    test('success returns expenses, incomes and rule503020', async () => {
      const res = await supertest(server.app).get(`${base}?year=2025`).set('Authorization', `Bearer ${token}`).expect(200)
      expect(res.body).toHaveProperty('expenses')
      expect(res.body).toHaveProperty('incomes')
      expect(res.body).toHaveProperty('rule503020')
      expect(res.body.rule503020).toHaveProperty('needs')
    })
  })
})
