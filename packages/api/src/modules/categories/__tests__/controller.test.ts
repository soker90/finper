import supertest from 'supertest'
import { faker } from '@faker-js/faker'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId, TRANSACTION } from '@soker90/finper-db'
import { and, eq, isNull, isNotNull } from 'drizzle-orm'
import { ERROR_MESSAGE } from '../../../i18n'
import { categoriesRoutes } from '../categories.routes'

const { categories, users } = schema

describe('Categories Controller', () => {
  let token: string
  const username = generateUsername()
  const otherUsername = generateUsername()
  const path = '/test-api/categories'

  // Inserta una categoría en SQLite (el server usa el mismo singleton `db`).
  const insertCategory = (data: { name?: string, type?: string, parentId?: string | null, budgetRuleClass?: string, user?: string } = {}) => {
    const id = generateId()
    const record = {
      id,
      name: data.name ?? faker.commerce.department(),
      type: data.type ?? TRANSACTION.Expense,
      parentId: data.parentId ?? null,
      budgetRuleClass: data.budgetRuleClass ?? 'none',
      user: data.user ?? username
    }
    sqliteDb.insert(categories).values(record).run()
    return { ...record, _id: id }
  }

  beforeAll(async () => {
    // Montaje en ruta de test (módulo construido SIN activar en server.ts).
    server.app.use('/test-api/categories', categoriesRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)

    token = await requestLogin(server.app, { username })
    // otherUsername necesita existir por la FK categories.user -> users.username
    sqliteDb.insert(users).values({ id: 'cat-other-user', username: otherUsername, password: 'pwd', createdAt: new Date(), updatedAt: new Date() }).run()
  })

  afterAll(async () => {
    sqliteDb.delete(users).where(eq(users.username, otherUsername)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    // Borrar hijas primero (FK RESTRICT sobre parentId), luego raíces.
    for (const u of [username, otherUsername]) {
      sqliteDb.delete(categories).where(and(eq(categories.user, u), isNotNull(categories.parentId))).run()
      sqliteDb.delete(categories).where(and(eq(categories.user, u), isNull(categories.parentId))).run()
    }
  })

  describe('POST /', () => {
    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['name', 'type'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, string> = {
        name: faker.commerce.department(),
        type: TRANSACTION.Expense
      }
      delete params[param]
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when success creating a category', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: faker.commerce.department(), type: TRANSACTION.Expense })
        .expect(200)
    })
  })

  describe('GET /', () => {
    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no categories, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are categories, it should return the categories', async () => {
      const root = insertCategory({ name: 'Root', user: username })
      const child = insertCategory({ name: 'Child', parentId: root._id, user: username })

      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)

      const responseChild = response.body.find((c: any) => c._id === child._id)
      expect(responseChild._id).toBe(child._id)
      expect(responseChild.name).toBe('Child')
      expect(responseChild.type).toBe(TRANSACTION.Expense)
      expect(responseChild.parent._id).toBe(root._id)
    })
  })

  describe('PATCH /:id', () => {
    const patchPath = (id: string) => `${path}/${id}`

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).patch(patchPath('any')).expect(401)
    })

    test('when id is not a valid ObjectId, it should respond 400', async () => {
      await supertest(server.app).patch(patchPath('not-a-valid-id')).auth(token, { type: 'bearer' }).send({}).expect(400)
    })

    test('when the category does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).patch(patchPath('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .send({})
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.CATEGORY.NOT_FOUND)
        })
    })

    test('when user is distinct, it should response an error with status code 404', async () => {
      const category = insertCategory({ user: otherUsername })
      await supertest(server.app).patch(patchPath(category._id)).auth(token, { type: 'bearer' })
        .send({ name: faker.commerce.department(), type: TRANSACTION.Expense })
        .expect(404)
    })

    test.each(['name', 'type'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const category = insertCategory({ user: username })
      const params: Record<string, string> = {
        name: faker.commerce.department(),
        type: TRANSACTION.Expense
      }
      delete params[param]
      await supertest(server.app)
        .patch(patchPath(category._id))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when fields are successfully edited', async () => {
      const category = insertCategory({ user: username })
      await supertest(server.app)
        .patch(patchPath(category._id))
        .set('Authorization', `Bearer ${token}`)
        .send({ name: faker.commerce.department(), type: TRANSACTION.Expense })
        .expect(200)
    })

    test('when parent in body does not exist, it should respond 404', async () => {
      const category = insertCategory({ user: username })
      await supertest(server.app)
        .patch(patchPath(category._id))
        .set('Authorization', `Bearer ${token}`)
        .send({ name: faker.commerce.department(), type: TRANSACTION.Expense, parent: '62a39498c4497e1fe3c2bf35' })
        .expect(404)
    })

    test('when parent in body exists, it should edit the category and respond 200', async () => {
      const root = insertCategory({ name: 'Root', user: username })
      const category = insertCategory({ name: 'Child', user: username })
      await supertest(server.app)
        .patch(patchPath(category._id))
        .set('Authorization', `Bearer ${token}`)
        .send({ name: faker.commerce.department(), type: TRANSACTION.Expense, parent: root._id })
        .expect(200)
    })
  })

  describe('DELETE /:id', () => {
    const deletePath = (id: string) => `${path}/${id}`

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).delete(deletePath('any')).expect(401)
    })

    test('when the category does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).delete(deletePath('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when exist the category, it should response with status code 200', async () => {
      const category = insertCategory({ user: username })
      await supertest(server.app).delete(deletePath(category._id)).set('Authorization', `Bearer ${token}`).expect(200)
    })

    test('when exist the category, but belongs to another user it should response with status code 404', async () => {
      const category = insertCategory({ user: otherUsername })
      await supertest(server.app).delete(deletePath(category._id)).set('Authorization', `Bearer ${token}`).expect(404)
    })

    // CASO NUEVO (opción C): borrar un padre con hijas -> 409.
    test('when the category is a parent of others, it should respond 409', async () => {
      const root = insertCategory({ name: 'Root', user: username })
      insertCategory({ name: 'Child', parentId: root._id, user: username })

      await supertest(server.app).delete(deletePath(root._id)).set('Authorization', `Bearer ${token}`)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.CATEGORY.HAS_CHILDREN)
        })
    })
  })

  describe('GET /grouped', () => {
    const groupedPath = `${path}/grouped`

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(groupedPath).expect(401)
    })

    test('when there are no categories, it should return an empty array', async () => {
      await supertest(server.app).get(groupedPath).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('returns root categories with their children', async () => {
      const root = insertCategory({ name: 'Root', user: username })
      insertCategory({ name: 'Child', parentId: root._id, user: username })

      const response = await supertest(server.app).get(groupedPath).auth(token, { type: 'bearer' }).expect(200)

      const found = response.body.find((r: any) => r._id === root._id)
      expect(found).toBeDefined()
      expect(Array.isArray(found.children)).toBe(true)
      expect(found.children[0].name).toBe('Child')
    })
  })
})
