import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { storesRoutes } from '../stores.routes'

const { stores, users } = schema

describe('Stores Controller', () => {
  let token: string
  const username = generateUsername()
  const path = '/test-api/stores'

  const insertStore = (name: string, user: string = username) => {
    const id = generateId()
    sqliteDb.insert(stores).values({ id, name, user }).run()
    return { _id: id, name, user }
  }

  beforeAll(async () => {
    server.app.use('/test-api/stores', storesRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })
  })

  afterAll(async () => {
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(stores).where(eq(stores.user, username)).run()
  })

  test('when token is not provided, it should response 401', async () => {
    await supertest(server.app).get(path).expect(401)
  })

  test('when there are no stores, it should return an empty array', async () => {
    const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
    expect(response.body).toEqual([])
  })

  test("should return the user's stores", async () => {
    insertStore('Store A')
    insertStore('Store B')
    const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
    expect(response.body).toHaveLength(2)
  })

  test('returned stores include _id and name and not user', async () => {
    insertStore('Store A')
    const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
    expect(response.body[0]).toHaveProperty('_id')
    expect(response.body[0]).toHaveProperty('name')
    expect(response.body[0]).not.toHaveProperty('user')
  })

  test('stores belonging to another user should not be included', async () => {
    const other = generateUsername()
    sqliteDb.insert(users).values({ id: 'store-ctrl-other', username: other, password: 'pwd', createdAt: new Date() }).run()
    insertStore('Theirs', other)
    insertStore('Mine')

    const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)
    expect(response.body).toHaveLength(1)

    sqliteDb.delete(stores).where(eq(stores.user, other)).run()
    sqliteDb.delete(users).where(eq(users.username, other)).run()
  })
})
