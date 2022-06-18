import supertest from 'supertest'
import {
  CategoryModel,
  ICategory,
  mongoose, TransactionType
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertCategory } from '../insert-data-to-model'
import { ERROR_MESSAGE } from '../../src/i18n'

const testDatabase = require('../test-db')(mongoose)

describe('Category', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /', () => {
    const path = '/api/categories'
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).expect(422)
    })

    test.each(['name', 'type'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, string> = {
        name: faker.commerce.department(),
        type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income
      }

      delete params[param]
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when success creating an account', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: faker.commerce.department(),
          type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income
        })
        .expect(200)
    })
  })

  describe('GET /', () => {
    const path = '/api/categories'
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    afterEach(() => CategoryModel.deleteMany({}))

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no categories, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are categories, it should return the accounts', async () => {
      const category = await insertCategory()
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [{
        _id: category._id.toString(),
        name: category.name,
        type: category.type,
      }])
    })
  })

  describe('PATCH /:id', () => {
    const path = (id: string) => `/api/categories/${id}`
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).patch(path('any')).expect(401)
    })

    test('when the category does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).patch(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.CATEGORY.NOT_FOUND)
        })
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      const category: ICategory = await insertCategory()
      await supertest(server.app).patch(path(category._id)).auth(token, { type: 'bearer' }).expect(422)
    })

    test.each(['name', 'type'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const category: ICategory = await insertCategory()
      const params: Record<string, string> = {
        name: faker.commerce.department(),
        type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income
      }

      delete params[param]
      await supertest(server.app)
        .patch(path(category._id))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when fields are successfully edited', async () => {
      const category: ICategory = await insertCategory()
      const params: Record<string, string | boolean> = {
        name: faker.commerce.department(),
        type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income
      }
      await supertest(server.app)
        .patch(path(category._id))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(200)
    })
  })

  describe('DELETE /:id', () => {
    const path = (id: string) => `/api/categories/${id}`
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    afterEach(() => CategoryModel.deleteMany({}))

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).delete(path('any')).expect(401)
    })

    test('when the category does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).delete(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when exist the category, it should response with status code 200', async () => {
      const category: ICategory = await insertCategory()

      await supertest(server.app).delete(path(category._id)).set('Authorization', `Bearer ${token}`).expect(200)
    })
  })
})
