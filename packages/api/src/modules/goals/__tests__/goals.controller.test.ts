import supertest from 'supertest'
import { eq } from 'drizzle-orm'
import { server } from '../../../server'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { GOAL_COLORS, GOAL_ICONS } from '../goals.validators'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'

import mongoose from 'mongoose'

import createTestDatabase from '../../../../test/test-db'

const { users, goals, accounts } = schema

describe('Goal Routes (SQLite integration)', () => {
  const path = '/api/goals'
  let token: string
  const username = generateUsername()
  const userId = generateId()
  let testMongoDb: any

  beforeAll(async () => {
    testMongoDb = createTestDatabase(mongoose)
    await testMongoDb.connect()

    token = await requestLogin(server.app, { username })
  })

  afterAll(async () => {
    sqliteDb.delete(users).where(eq(users.id, userId)).run()
    sqliteDb.delete(goals).run()
    await testMongoDb.close()
  })

  afterEach(async () => {
    sqliteDb.delete(goals).where(eq(goals.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
  })

  const validPayload = {
    name: 'New Car',
    targetAmount: 5000,
    currentAmount: 0,
    deadline: '2030-12-31T00:00:00.000Z',
    color: '#4CAF50',
    icon: 'CarOutlined'
  }

  const addBalance = (balance: number) =>
    sqliteDb.insert(accounts).values({ id: generateId(), name: 'Bank', bank: 'MyBank', balance, isActive: true, user: username }).run()

  describe('POST /api/goals', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    it('returns 422 when body is empty', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send({}).expect(422)
    })

    it.each(['name', 'targetAmount', 'color', 'icon'])('returns 422 when %s is missing', async (param: string) => {
      const payload: Record<string, string | number> = { ...validPayload }
      delete payload[param]
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(payload).expect(422)
    })

    it('creates a goal and returns 201 when it fits in balance', async () => {
      // Add balance in Mongo
      addBalance(10000)

      const payloadWithBalance = { ...validPayload, currentAmount: 1000 }
      const response = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(payloadWithBalance)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('_id')
      expect(response.body.name).toBe('New Car')
      expect(response.body.currentAmount).toBe(1000)
    })

    it('returns 400 when initial allocation exceeds available balance', async () => {
      addBalance(500)

      const payloadWithBalance = { ...validPayload, currentAmount: 1000 }
      const response = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(payloadWithBalance)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/goals', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    it('returns empty array if no goals', async () => {
      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })
  })

  describe('GET /api/goals/:id', () => {
    it('returns 400 for invalid id format', async () => {
      await supertest(server.app)
        .get(`${path}/invalid-id`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })

    it('returns 404 for non-existent goal', async () => {
      const fakeId = generateId()
      const response = await supertest(server.app)
        .get(`${path}/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(404)
    })

    it('returns 404 for goal belonging to another user', async () => {
      const created = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validPayload)
      const id = created.body._id

      const otherUser = generateUsername()
      const otherUserId = generateId()

      const otherToken = await requestLogin(server.app, { username: otherUser })

      await supertest(server.app).get(`${path}/${id}`).set('Authorization', `Bearer ${otherToken}`).expect(404)

      sqliteDb.delete(users).where(eq(users.id, otherUserId)).run()
    })
  })

  describe('PUT /api/goals/:id', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).put(`${path}/some-id`).expect(401)
    })

    it('returns 400 for invalid id format', async () => {
      await supertest(server.app).put(`${path}/invalid-id`).set('Authorization', `Bearer ${token}`).send({ name: 'updated' }).expect(400)
    })

    it('returns 404 for non-existent goal', async () => {
      await supertest(server.app).put(`${path}/000000000000000000000000`).set('Authorization', `Bearer ${token}`).send({ name: 'updated' }).expect(404)
    })

    it('updates a goal successfully', async () => {
      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload)

      const id = created.body._id

      const response = await supertest(server.app)
        .put(`${path}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Even Newer Car' })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Even Newer Car')
    })

    it('returns 422 when updating currentAmount (read-only)', async () => {
      const created = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validPayload)
      const id = created.body._id

      await supertest(server.app).put(`${path}/${id}`).set('Authorization', `Bearer ${token}`).send({ currentAmount: 500 }).expect(422)
    })
  })

  describe('POST /api/goals/:id/fund', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).post(`${path}/some-id/fund`).expect(401)
    })

    it('returns 400 for invalid id format', async () => {
      await supertest(server.app).post(`${path}/invalid-id/fund`).set('Authorization', `Bearer ${token}`).send({ amount: 100 }).expect(400)
    })

    it('returns 422 when amount is missing', async () => {
      const created = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validPayload)
      await supertest(server.app).post(`${path}/${created.body._id}/fund`).set('Authorization', `Bearer ${token}`).send({}).expect(422)
    })

    it('returns 422 when amount is not positive', async () => {
      const created = await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).send(validPayload)
      await supertest(server.app).post(`${path}/${created.body._id}/fund`).set('Authorization', `Bearer ${token}`).send({ amount: -10 }).expect(422)
    })

    it('funds a goal if there is enough account balance', async () => {
      addBalance(2000)

      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload)

      const id = created.body._id

      const response = await supertest(server.app)
        .post(`${path}/${id}/fund`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 500 })

      expect(response.status).toBe(200)
      expect(response.body.currentAmount).toBe(500)
    })

    it('returns 400 if fund exceeds account balance', async () => {
      addBalance(200)

      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload)

      const id = created.body._id

      const response = await supertest(server.app)
        .post(`${path}/${id}/fund`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 500 })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/goals/:id/withdraw', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).post(`${path}/some-id/withdraw`).expect(401)
    })

    it('returns 400 for invalid id format', async () => {
      await supertest(server.app).post(`${path}/invalid-id/withdraw`).set('Authorization', `Bearer ${token}`).send({ amount: 100 }).expect(400)
    })

    it('withdraws from a goal if sufficient funds in goal', async () => {
      addBalance(1000)

      const payloadWithBalance = { ...validPayload, currentAmount: 500 }
      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(payloadWithBalance)

      const id = created.body._id

      const response = await supertest(server.app)
        .post(`${path}/${id}/withdraw`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 200 })

      expect(response.status).toBe(200)
      expect(response.body.currentAmount).toBe(300)
    })

    it('returns 400 if withdraw amount exceeds goal balance', async () => {
      addBalance(1000)

      const payloadWithBalance = { ...validPayload, currentAmount: 100 }
      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(payloadWithBalance)

      const id = created.body._id

      const response = await supertest(server.app)
        .post(`${path}/${id}/withdraw`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 200 })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/goals/:id', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).delete(`${path}/some-id`).expect(401)
    })

    it('returns 400 for invalid id format', async () => {
      await supertest(server.app).delete(`${path}/invalid-id`).set('Authorization', `Bearer ${token}`).expect(400)
    })

    it('returns 404 for non-existent goal', async () => {
      await supertest(server.app).delete(`${path}/000000000000000000000000`).set('Authorization', `Bearer ${token}`).expect(404)
    })

    it('deletes a goal', async () => {
      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload)

      const id = created.body._id

      const response = await supertest(server.app)
        .delete(`${path}/${id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(204)
    })
  })
})
