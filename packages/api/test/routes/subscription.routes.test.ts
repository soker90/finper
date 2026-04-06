import supertest from 'supertest'
import {
  SubscriptionCycle,
  SubscriptionModel,
  mongoose
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertAccount, insertCategory } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Subscriptions', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())

  describe('PUT /api/subscriptions/:id', () => {
    const path = (id: string) => `/api/subscriptions/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app)
        .put(path('62a39498c4497e1fe3c2bf35'))
        .expect(401)
    })

    test('when subscription does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .put(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .send({ name: 'Nuevo nombre' })
        .expect(404)
    })

    test('when payload is valid, it should update the subscription', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const subscription = await SubscriptionModel.create({
        name: 'Netflix',
        amount: 9.99,
        cycle: SubscriptionCycle.MONTHLY,
        categoryId: category._id,
        accountId: account._id,
        user
      })
      const newName = faker.company.name()

      const res = await supertest(server.app)
        .put(path(subscription._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ name: newName })
        .expect(200)

      expect(res.body.name).toBe(newName)

      const updated = await SubscriptionModel.findById(subscription._id).lean()
      expect(updated?.name).toBe(newName)
    })
  })
})
