import supertest from 'supertest'
import { eq } from 'drizzle-orm'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { debtsRepository } from '../debts.repository'
import { schema, generateId } from '@soker90/finper-db'

const { users, debts } = schema

describe('debtsController', () => {
  let token: string
  const username = generateUsername()
  const userId = generateId()

  beforeAll(async () => {

    token = await requestLogin(server.app, { username })
  })

  afterAll(async () => {
    sqliteDb.delete(users).where(eq(users.id, userId)).run()
  })

  afterEach(() => {
    sqliteDb.delete(debts).where(eq(debts.user, username)).run()
  })

  describe('GET /api/debts', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).get('/api/debts').expect(401)
    })

    it('should return 200 with debts list', async () => {
      await debtsRepository.create(username, { from: 'Alice', amount: 100, type: 'to' })

      const response = await supertest(server.app)
        .get('/api/debts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('to')
      expect(response.body).toHaveProperty('from')
      expect(response.body).toHaveProperty('debtsByPerson')
      expect(response.body.to).toHaveLength(1)
      expect(response.body.to[0].from).toBe('Alice')
    })
  })

  describe('POST /api/debts', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).post('/api/debts').expect(401)
    })

    it('returns 422 when body is empty', async () => {
      await supertest(server.app).post('/api/debts').set('Authorization', `Bearer ${token}`).send({}).expect(422)
    })

    it.each(['from', 'amount', 'type'])('returns 422 when %s is missing', async (param: string) => {
      const payload: Record<string, string | number> = { from: 'Alice', amount: 100, type: 'to' }
      delete payload[param]
      await supertest(server.app).post('/api/debts').set('Authorization', `Bearer ${token}`).send(payload).expect(422)
    })

    it('should create a debt and return 201', async () => {
      const response = await supertest(server.app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${token}`)
        .send({ from: 'Bob', amount: 50, type: 'from' })
        .expect(201)

      expect(response.body.from).toBe('Bob')
      expect(response.body.amount).toBe(50)
      expect(response.body._id).toMatch(/^[0-9a-f]{24}$/)
    })
  })

  describe('GET /api/debts/from/:from', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).get('/api/debts/from/Alice').expect(401)
    })

    it('returns empty array when there are no debts', async () => {
      await supertest(server.app).get('/api/debts/from/Alice').set('Authorization', `Bearer ${token}`).expect(200, [])
    })

    it('returns the debts for a specific person', async () => {
      await debtsRepository.create(username, { from: 'Alice', amount: 100, type: 'from' })
      const response = await supertest(server.app).get('/api/debts/from/Alice').set('Authorization', `Bearer ${token}`).expect(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].from).toBe('Alice')
      expect(response.body[0].amount).toBe(100)
    })
  })

  describe('PUT /api/debts/:id', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).put('/api/debts/some-id').expect(401)
    })

    it('returns 400 for invalid id format', async () => {
      await supertest(server.app).put('/api/debts/invalid-id').set('Authorization', `Bearer ${token}`).expect(400)
    })

    it('returns 404 for non-existent debt', async () => {
      await supertest(server.app).put('/api/debts/000000000000000000000000').set('Authorization', `Bearer ${token}`).send({ from: 'Alice', amount: 100, type: 'to' }).expect(404)
    })

    it('returns 404 for debt belonging to another user', async () => {
      const created = await supertest(server.app).post('/api/debts').set('Authorization', `Bearer ${token}`).send({ from: 'Alice', amount: 100, type: 'to' })
      const id = created.body._id

      const otherUser = generateUsername()
      const otherUserId = generateId()

      const otherToken = await requestLogin(server.app, { username: otherUser })

      await supertest(server.app).put(`/api/debts/${id}`).set('Authorization', `Bearer ${otherToken}`).send({ from: 'Bob', amount: 200, type: 'from' }).expect(404)

      sqliteDb.delete(users).where(eq(users.id, otherUserId)).run()
    })

    it.each(['from', 'amount', 'type'])('returns 422 when %s is missing', async (param: string) => {
      const created = await supertest(server.app).post('/api/debts').set('Authorization', `Bearer ${token}`).send({ from: 'Alice', amount: 100, type: 'to' })
      const id = created.body._id

      const payload: Record<string, string | number> = { from: 'Bob', amount: 200, type: 'from' }
      delete payload[param]

      const res = await supertest(server.app).put(`/api/debts/${id}`).set('Authorization', `Bearer ${token}`).send(payload)
      if (res.status !== 422) {
        console.log('PUT response:', res.status, res.body)
      }
      expect(res.status).toBe(422)
    })
  })

  describe('DELETE /api/debts/:id', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).delete('/api/debts/some-id').expect(401)
    })

    it('returns 400 for invalid id format', async () => {
      await supertest(server.app).delete('/api/debts/invalid-id').set('Authorization', `Bearer ${token}`).expect(400)
    })

    it('returns 404 for non-existent debt', async () => {
      await supertest(server.app).delete('/api/debts/000000000000000000000000').set('Authorization', `Bearer ${token}`).expect(404)
    })

    it('returns 404 for debt belonging to another user', async () => {
      const created = await supertest(server.app).post('/api/debts').set('Authorization', `Bearer ${token}`).send({ from: 'Alice', amount: 100, type: 'to' })
      const id = created.body._id

      const otherUser = generateUsername()
      const otherUserId = generateId()

      const otherToken = await requestLogin(server.app, { username: otherUser })

      await supertest(server.app).delete(`/api/debts/${id}`).set('Authorization', `Bearer ${otherToken}`).expect(404)

      sqliteDb.delete(users).where(eq(users.id, otherUserId)).run()
    })
  })

  describe('POST /api/debts/:id/pay', () => {
    it('returns 401 when token is missing', async () => {
      await supertest(server.app).post('/api/debts/some-id/pay').expect(401)
    })

    it('returns 400 for invalid id format', async () => {
      await supertest(server.app).post('/api/debts/invalid-id/pay').set('Authorization', `Bearer ${token}`).send({ amount: 10 }).expect(400)
    })

    it('returns 404 for non-existent debt', async () => {
      await supertest(server.app).post('/api/debts/000000000000000000000000/pay').set('Authorization', `Bearer ${token}`).send({ amount: 10 }).expect(404)
    })

    it('returns 422 when amount is missing', async () => {
      const created = await supertest(server.app).post('/api/debts').set('Authorization', `Bearer ${token}`).send({ from: 'Alice', amount: 100, type: 'to' })
      const id = created.body._id
      await supertest(server.app).post(`/api/debts/${id}/pay`).set('Authorization', `Bearer ${token}`).send({}).expect(422)
    })

    it('should add a payment and return 200', async () => {
      const created = await supertest(server.app).post('/api/debts').set('Authorization', `Bearer ${token}`).send({ from: 'Alice', amount: 100, type: 'to' })
      const id = created.body._id

      const res = await supertest(server.app).post(`/api/debts/${id}/pay`).set('Authorization', `Bearer ${token}`).send({ amount: 50 }).expect(200)

      expect(res.body.amount).toBe(50)
    })
  })
})
