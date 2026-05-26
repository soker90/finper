import supertest from 'supertest'
import { eq } from 'drizzle-orm'
import { server } from '../../../server'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'

import mongoose from 'mongoose'
import { AccountModel } from '@soker90/finper-models'
import createTestDatabase from '../../../../test/test-db'

const { users, goals } = schema

describe('Goal Routes (SQLite integration)', () => {
  const path = '/api/goals'
  let token: string
  const username = generateUsername()
  const userId = generateId()
  let testMongoDb: any

  beforeAll(async () => {
    testMongoDb = createTestDatabase(mongoose)
    await testMongoDb.connect()

    sqliteDb.insert(users).values({
      id: userId,
      username,
      password: 'pwd-hash',
      createdAt: new Date()
    }).run()

    token = await requestLogin(server.app, { username })
  })

  afterAll(async () => {
    sqliteDb.delete(users).where(eq(users.id, userId)).run()
    sqliteDb.delete(goals).run()
    await testMongoDb.close()
  })

  afterEach(async () => {
    sqliteDb.delete(goals).run()
    await AccountModel.deleteMany({})
  })

  const validPayload = {
    name: 'New Car',
    targetAmount: 5000,
    currentAmount: 0,
    deadline: '2030-12-31T00:00:00.000Z',
    color: '#4CAF50',
    icon: 'CarOutlined'
  }

  describe('POST /api/goals', () => {
    it('creates a goal and returns 201 when it fits in balance', async () => {
      // Add balance in Mongo
      await AccountModel.create({
        user: username,
        name: 'Bank',
        balance: 10000,
        bank: 'MyBank',
        isActive: true
      })

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
      await AccountModel.create({
        user: username,
        name: 'Bank',
        balance: 500,
        bank: 'MyBank',
        isActive: true
      })

      const payloadWithBalance = { ...validPayload, currentAmount: 1000 }
      const response = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(payloadWithBalance)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/goals', () => {
    it('returns empty array if no goals', async () => {
      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })
  })

  describe('GET /api/goals/:id', () => {
    it('returns 404 for non-existent goal', async () => {
      const fakeId = generateId()
      const response = await supertest(server.app)
        .get(`${path}/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/goals/:id', () => {
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
  })

  describe('POST /api/goals/:id/fund', () => {
    it('funds a goal if there is enough account balance', async () => {
      await AccountModel.create({
        user: username,
        name: 'Bank',
        balance: 2000,
        bank: 'MyBank',
        isActive: true
      })

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
      await AccountModel.create({
        user: username,
        name: 'Bank',
        balance: 200,
        bank: 'MyBank',
        isActive: true
      })

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
    it('withdraws from a goal if sufficient funds in goal', async () => {
      await AccountModel.create({
        user: username,
        name: 'Bank',
        balance: 1000,
        bank: 'MyBank',
        isActive: true
      })

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
      await AccountModel.create({
        user: username,
        name: 'Bank',
        balance: 1000,
        bank: 'MyBank',
        isActive: true
      })

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
