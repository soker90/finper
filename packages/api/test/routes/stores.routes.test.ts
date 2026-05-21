import supertest from 'supertest'
import { StoreModel, mongoose } from '@soker90/finper-models'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertStore } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Stores', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())

  describe('GET /stores', () => {
    const path = '/api/stores'
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(async () => {
      await StoreModel.deleteMany({})
    })

    test('when token is not provided, it should response 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no stores, it should return an empty array', async () => {
      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toEqual([])
    })

    test("should return the user's stores", async () => {
      await insertStore({ user })
      await insertStore({ user })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(2)
    })

    test('returned stores include _id and name', async () => {
      await insertStore({ user })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      const store = response.body[0]
      expect(store).toHaveProperty('_id')
      expect(store).toHaveProperty('name')
      // user field must not be exposed (select proyección '_id name')
      expect(store).not.toHaveProperty('user')
    })

    test('stores belonging to another user should not be included', async () => {
      await insertStore({ user: generateUsername() }) // otro usuario
      await insertStore({ user })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toHaveLength(1)
    })
  })
})
