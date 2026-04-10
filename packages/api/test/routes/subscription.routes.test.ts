import supertest from 'supertest'
import {
  SUBSCRIPTION_CYCLE,
  SubscriptionModel,
  SubscriptionCandidateModel,
  TransactionModel,
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
          cycle: SUBSCRIPTION_CYCLE.MONTHLY,
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
        cycle: SUBSCRIPTION_CYCLE.MONTHLY,
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

  // ── POST /api/subscriptions — additional validations ────────────────────
  describe('POST /api/subscriptions — additional validations', () => {
    const path = '/api/subscriptions'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when amount is zero or negative, it should respond 422', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({
          name: 'Test',
          amount: -5,
          cycle: SUBSCRIPTION_CYCLE.MONTHLY,
          categoryId: category._id.toString(),
          accountId: account._id.toString()
        })
        .expect(422)
    })

    test('when cycle is invalid, it should respond 422', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({
          name: 'Test',
          amount: 9.99,
          cycle: 'biweekly',
          categoryId: category._id.toString(),
          accountId: account._id.toString()
        })
        .expect(422)
    })

    test('when categoryId does not belong to user, it should respond 404', async () => {
      const account = await insertAccount({ user })
      const otherCategory = await insertCategory({ user: generateUsername() })

      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({
          name: 'Test',
          amount: 9.99,
          cycle: SUBSCRIPTION_CYCLE.MONTHLY,
          categoryId: otherCategory._id.toString(),
          accountId: account._id.toString()
        })
        .expect(404)
    })

    test('when accountId does not belong to user, it should respond 404', async () => {
      const otherAccount = await insertAccount({ user: generateUsername() })
      const category = await insertCategory({ user })

      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({
          name: 'Test',
          amount: 9.99,
          cycle: SUBSCRIPTION_CYCLE.MONTHLY,
          categoryId: category._id.toString(),
          accountId: otherAccount._id.toString()
        })
        .expect(404)
    })

    test('nextPaymentDate is null after creation', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      const res = await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({
          name: 'Spotify',
          amount: 4.99,
          cycle: SUBSCRIPTION_CYCLE.MONTHLY,
          categoryId: category._id.toString(),
          accountId: account._id.toString()
        })
        .expect(200)

      expect(res.body.nextPaymentDate).toBeNull()
    })
  })

  // ── GET /api/subscriptions — additional ─────────────────────────────────
  describe('GET /api/subscriptions — additional', () => {
    const path = '/api/subscriptions'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('returns empty array when user has no subscriptions', async () => {
      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body).toEqual([])
    })

    test('returns subscriptions ordered by nextPaymentDate ascending (nulls first)', async () => {
      const now = Date.now()
      await insertSubscription({ user, nextPaymentDate: now + 10000 })
      await insertSubscription({ user, nextPaymentDate: null })
      await insertSubscription({ user, nextPaymentDate: now + 5000 })

      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      const dates = res.body.map((s: any) => s.nextPaymentDate)
      expect(dates[0]).toBeNull()
      expect(dates[1]).toBe(now + 5000)
      expect(dates[2]).toBe(now + 10000)
    })
  })

  // ── PUT /api/subscriptions/:id — additional ─────────────────────────────
  describe('PUT /api/subscriptions/:id — additional', () => {
    const path = (id: string) => `/api/subscriptions/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when subscription belongs to another user, it should respond 404', async () => {
      const other = generateUsername()
      const sub = await insertSubscription({ user: other })

      await supertest(server.app)
        .put(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ name: 'Hijacked' })
        .expect(404)
    })

    test('partial update does not alter untouched fields', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id, amount: 15 })

      const res = await supertest(server.app)
        .put(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ name: 'New name' })
        .expect(200)

      expect(res.body.amount).toBe(15)
    })

    test('422 when amount is negative', async () => {
      const sub = await insertSubscription({ user })

      await supertest(server.app)
        .put(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ amount: -5 })
        .expect(422)
    })

    test('422 when cycle is not a valid value', async () => {
      const sub = await insertSubscription({ user })

      await supertest(server.app)
        .put(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ cycle: 'invalid-cycle' })
        .expect(422)
    })

    test('404 when categoryId does not belong to user', async () => {
      const sub = await insertSubscription({ user })
      const otherCategory = await insertCategory({ user: generateUsername() })

      await supertest(server.app)
        .put(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ categoryId: otherCategory._id.toString() })
        .expect(404)
    })

    test('404 when accountId does not belong to user', async () => {
      const sub = await insertSubscription({ user })
      const otherAccount = await insertAccount({ user: generateUsername() })

      await supertest(server.app)
        .put(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ accountId: otherAccount._id.toString() })
        .expect(404)
    })

    test('200 when updating categoryId with a valid category', async () => {
      const sub = await insertSubscription({ user })
      const newCategory = await insertCategory({ user })

      const res = await supertest(server.app)
        .put(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ categoryId: newCategory._id.toString() })
        .expect(200)

      expect(res.body.categoryId.toString()).toBe(newCategory._id.toString())
    })

    test('200 when updating accountId with a valid account', async () => {
      const sub = await insertSubscription({ user })
      const newAccount = await insertAccount({ user })

      const res = await supertest(server.app)
        .put(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ accountId: newAccount._id.toString() })
        .expect(200)

      expect(res.body.accountId.toString()).toBe(newAccount._id.toString())
    })
  })

  // ── DELETE /api/subscriptions/:id — additional ──────────────────────────
  describe('DELETE /api/subscriptions/:id — additional', () => {
    const path = (id: string) => `/api/subscriptions/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when subscription belongs to another user, it should respond 404', async () => {
      const other = generateUsername()
      const sub = await insertSubscription({ user: other })

      await supertest(server.app)
        .delete(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })
  })

  // ── GET /api/subscriptions/:id/transactions ─────────────────────────────
  describe('GET /api/subscriptions/:id/transactions', () => {
    const path = (id: string) => `/api/subscriptions/${id}/transactions`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).get(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when subscription does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .get(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when no transactions are linked, it should return empty array', async () => {
      const sub = await insertSubscription({ user })

      const res = await supertest(server.app)
        .get(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body).toEqual([])
    })

    test('returns only transactions linked to the given subscription', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })

      const tx = await TransactionModel.create({
        date: Date.now(),
        amount: 9.99,
        type: 'expense',
        category: category._id,
        account: account._id,
        subscriptionId: sub._id,
        user
      })
      await insertTransaction({ user }) // unlinked — must not appear

      const res = await supertest(server.app)
        .get(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body.length).toBe(1)
      expect(res.body[0]._id).toBe(tx._id.toString())
    })
  })

  // ── GET /api/subscriptions/:id/matching-transactions ────────────────────
  describe('GET /api/subscriptions/:id/matching-transactions', () => {
    const path = (id: string) => `/api/subscriptions/${id}/matching-transactions`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).get(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when subscription does not exist, it should return empty array', async () => {
      const res = await supertest(server.app)
        .get(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body).toEqual([])
    })

    test('returns unlinked transactions matching category and account', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })

      await TransactionModel.create({
        date: Date.now(),
        amount: 9.99,
        type: 'expense',
        category: category._id,
        account: account._id,
        user
      })

      const res = await supertest(server.app)
        .get(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })

    test('excludes transactions already linked to a subscription', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const otherSub = await insertSubscription({ user })

      await TransactionModel.create({
        date: Date.now(),
        amount: 9.99,
        type: 'expense',
        category: category._id,
        account: account._id,
        subscriptionId: otherSub._id,
        user
      })

      const res = await supertest(server.app)
        .get(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(200)

      res.body.forEach((tx: any) => {
        expect(tx.subscriptionId).toBeUndefined()
      })
    })

    test('returns at most 50 results', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })

      await Promise.all(
        Array.from({ length: 55 }, () =>
          TransactionModel.create({
            date: Date.now(),
            amount: 9.99,
            type: 'expense',
            category: category._id,
            account: account._id,
            user
          })
        )
      )

      const res = await supertest(server.app)
        .get(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body.length).toBe(50)
    })
  })

  // ── POST /api/subscriptions/:id/link-transactions ───────────────────────
  describe('POST /api/subscriptions/:id/link-transactions', () => {
    const path = (id: string) => `/api/subscriptions/${id}/link-transactions`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path('62a39498c4497e1fe3c2bf35')).expect(401)
    })

    test('when subscription does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .post(path('62a39498c4497e1fe3c2bf35'))
        .auth(token, { type: 'bearer' })
        .send({ transactionIds: ['62a39498c4497e1fe3c2bf35'] })
        .expect(404)
    })

    test('when transactionIds is missing, it should respond 422', async () => {
      const sub = await insertSubscription({ user })

      await supertest(server.app)
        .post(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({})
        .expect(422)
    })

    test('links transactions and updates nextPaymentDate', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id, cycle: SUBSCRIPTION_CYCLE.MONTHLY })
      const txDate = new Date('2024-03-10T12:00:00Z').getTime()
      const tx = await TransactionModel.create({
        date: txDate,
        amount: 9.99,
        type: 'expense',
        category: category._id,
        account: account._id,
        user
      })

      await supertest(server.app)
        .post(path(sub._id.toString()))
        .auth(token, { type: 'bearer' })
        .send({ transactionIds: [tx._id.toString()] })
        .expect(204)

      const updatedTx = await TransactionModel.findById(tx._id).lean()
      expect(updatedTx?.subscriptionId?.toString()).toBe(sub._id.toString())

      const updatedSub = await SubscriptionModel.findById(sub._id).lean()
      expect(updatedSub?.nextPaymentDate).not.toBeNull()
    })
  })

  // ── DELETE /api/subscriptions/:id/unlink-transactions/:transactionId ────
  describe('DELETE /api/subscriptions/:id/unlink-transactions/:transactionId', () => {
    const path = (id: string, txId: string) =>
      `/api/subscriptions/${id}/unlink-transactions/${txId}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app)
        .delete(path('62a39498c4497e1fe3c2bf35', '62a39498c4497e1fe3c2bf36'))
        .expect(401)
    })

    test('when subscription does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .delete(path('62a39498c4497e1fe3c2bf35', '62a39498c4497e1fe3c2bf36'))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when subscription belongs to another user, it should respond 404', async () => {
      const other = generateUsername()
      const sub = await insertSubscription({ user: other })
      const tx = await insertTransaction({ user: other })

      await supertest(server.app)
        .delete(path(sub._id.toString(), tx._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('unlinks the transaction and recalculates nextPaymentDate', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const tx = await TransactionModel.create({
        date: Date.now(),
        amount: 9.99,
        type: 'expense',
        category: category._id,
        account: account._id,
        subscriptionId: sub._id,
        user
      })

      await supertest(server.app)
        .delete(path(sub._id.toString(), tx._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(204)

      const updatedTx = await TransactionModel.findById(tx._id).lean()
      expect((updatedTx as any)?.subscriptionId).toBeUndefined()

      const updatedSub = await SubscriptionModel.findById(sub._id).lean()
      expect(updatedSub?.nextPaymentDate).toBeNull()
    })
  })

  // ── GET /api/subscriptions/candidates — additional ───────────────────────
  describe('GET /api/subscriptions/candidates — additional', () => {
    const path = '/api/subscriptions/candidates'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('returns empty array when user has no candidates', async () => {
      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body).toEqual([])
    })

    test('returns only candidates of the authenticated user', async () => {
      await insertSubscriptionCandidate({ user })
      const otherUser = generateUsername()
      await insertSubscriptionCandidate({ user: otherUser })

      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body.length).toBe(1)
    })
  })

  // ── POST /api/subscriptions/candidates/:id/assign — additional ───────────
  describe('POST /api/subscriptions/candidates/:id/assign — additional', () => {
    const path = (id: string) => `/api/subscriptions/candidates/${id}/assign`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('updates nextPaymentDate of the subscription after assign', async () => {
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id, cycle: SUBSCRIPTION_CYCLE.MONTHLY })
      const txDate = new Date('2024-04-10T12:00:00Z').getTime()
      const tx = await TransactionModel.create({
        date: txDate,
        amount: 9.99,
        type: 'expense',
        category: category._id,
        account: account._id,
        user
      })
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

      // Give recalculation time to settle (it's fire-and-forget)
      await new Promise(resolve => setTimeout(resolve, 100))

      const updatedSub = await SubscriptionModel.findById(sub._id).lean()
      expect(updatedSub?.nextPaymentDate).not.toBeNull()
    })
  })

  // ── Controller error paths (catch handlers) ──────────────────────────────
  describe('Controller catch handlers', () => {
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('GET /api/subscriptions — propagates DB error as 500', async () => {
      const spy = jest
        .spyOn(SubscriptionModel, 'find')
        .mockImplementationOnce(() => { throw new Error('DB failure') })

      await supertest(server.app)
        .get('/api/subscriptions')
        .auth(token, { type: 'bearer' })
        .expect(500)

      spy.mockRestore()
    })

    test('GET /api/subscriptions/:id/matching-transactions — propagates DB error as 500', async () => {
      const spy = jest
        .spyOn(SubscriptionModel, 'findOne')
        .mockRejectedValueOnce(new Error('DB failure'))

      await supertest(server.app)
        .get('/api/subscriptions/62a39498c4497e1fe3c2bf35/matching-transactions')
        .auth(token, { type: 'bearer' })
        .expect(500)

      spy.mockRestore()
    })

    test('GET /api/subscriptions/candidates — propagates DB error as 500', async () => {
      const spy = jest
        .spyOn(SubscriptionCandidateModel, 'find')
        .mockImplementationOnce(() => { throw new Error('DB failure') })

      await supertest(server.app)
        .get('/api/subscriptions/candidates')
        .auth(token, { type: 'bearer' })
        .expect(500)

      spy.mockRestore()
    })
  })
})
