import supertest from 'supertest'
import {
  SubscriptionCycle,
  SubscriptionModel,
  SubscriptionCandidateModel,
  mongoose
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import {
  insertAccount,
  insertCategory,
  insertSubscription,
  insertSubscriptionCandidate,
  insertTransaction
} from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Subscriptions', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())

  // ── POST /api/subscriptions ─────────────────────────────────────────────
  describe('POST /api/subscriptions', () => {
    const path = '/api/subscriptions'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when required fields are missing, it should respond 422', async () => {
      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({ name: 'Incompleto' })
        .expect(422)
    })

    test('when payload is valid, it should create subscription', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      const res = await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({
          name: 'Netflix',
          amount: 9.99,
          cycle: SubscriptionCycle.MONTHLY,
          categoryId: category._id.toString(),
          accountId: account._id.toString()
        })
        .expect(200)

      expect(res.body.name).toBe('Netflix')
      expect(res.body.amount).toBe(9.99)

      const saved = await SubscriptionModel.findById(res.body._id).lean()
      expect(saved).not.toBeNull()
      expect(saved?.user).toBe(user)
    })
  })

  // ── GET /api/subscriptions ──────────────────────────────────────────────
  describe('GET /api/subscriptions', () => {
    const path = '/api/subscriptions'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
      await insertSubscription({ user })
      await insertSubscription({ user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('it should return only subscriptions of the authenticated user', async () => {
      const otherUser = generateUsername()
      await insertSubscription({ user: otherUser })

      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(2)
      res.body.forEach((s: any) => {
        expect(s.categoryId).toHaveProperty('name')
        expect(s.accountId).toHaveProperty('name')
      })
    })
  })

  // ── PUT /api/subscriptions/:id ──────────────────────────────────────────
  describe('PUT /api/subscriptions/:id', () => {
    const path = (id: string) => `/api/subscriptions/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35')).expect(401)
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

  // ── DELETE /api/subscriptions/:id ───────────────────────────────────────
  describe('DELETE /api/subscriptions/:id', () => {
    const path = (id: string) => `/api/subscriptions/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).delete(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when subscription does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .delete(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when id is valid, it should delete the subscription', async () => {
      const sub = await insertSubscription({ user })

      await supertest(server.app)
        .delete(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(204)

      const deleted = await SubscriptionModel.findById(sub._id).lean()
      expect(deleted).toBeNull()
    })
  })

  // ── GET /api/subscriptions/candidates ───────────────────────────────────
  describe('GET /api/subscriptions/candidates', () => {
    const path = '/api/subscriptions/candidates'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
      await insertSubscriptionCandidate({ user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('it should return candidates for the authenticated user', async () => {
      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── POST /api/subscriptions/candidates/:id/dismiss ───────────────────────
  describe('POST /api/subscriptions/candidates/:id/dismiss', () => {
    const path = (id: string) => `/api/subscriptions/candidates/${id}/dismiss`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when candidate does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .post(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when id is valid, it should remove the candidate', async () => {
      const candidate = await insertSubscriptionCandidate({ user })

      await supertest(server.app)
        .post(path(candidate._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(204)

      const deleted = await SubscriptionCandidateModel.findById(candidate._id).lean()
      expect(deleted).toBeNull()
    })
  })

  // ── POST /api/subscriptions/candidates/:id/assign ────────────────────────
  describe('POST /api/subscriptions/candidates/:id/assign', () => {
    const path = (id: string) => `/api/subscriptions/candidates/${id}/assign`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when candidate does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .post(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .send({ subscriptionId: '62a39498c4497e1fe3c2bf35' })
        .expect(404)
    })

    test('when valid, it should remove the candidate', async () => {
      const sub = await insertSubscription({ user })
      const tx = await insertTransaction({ user })
      const candidate = await insertSubscriptionCandidate({
        user,
        transactionId: tx._id,
        subscriptionId: sub._id
      })

      await supertest(server.app)
        .post(path(candidate._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ subscriptionId: sub._id.toString() })
        .expect(204)

      const deleted = await SubscriptionCandidateModel.findById(candidate._id).lean()
      expect(deleted).toBeNull()
    })
  })
})
