import supertest from 'supertest'
import { server } from '../../../server'
import { ERROR_MESSAGE } from '../../../i18n'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { pensions, pensionPlans } = schema

describe('Pension Plans Routes', () => {
  const path = '/api/pension-plans'
  let token: string
  const user = generateUsername()

  beforeAll(async () => {
    token = await requestLogin(server.app, { username: user })
  })

  afterEach(() => {
    sqliteDb.delete(pensions).where(eq(pensions.user, user)).run()
    sqliteDb.delete(pensionPlans).where(eq(pensionPlans.user, user)).run()
  })

  describe('CRUD /api/pension-plans', () => {
    test('GET / without token returns 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('POST / with no name returns 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ color: '#4CAF50' }).expect(422)
    })

    test('POST / with no color returns 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan' }).expect(422)
    })

    test('POST / with a color outside the allowed palette returns 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan', color: '#000000' }).expect(422)
    })

    test('POST / creates a plan', async () => {
      const response = await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({ name: 'Plan Nómina', color: '#4CAF50' })
        .expect(201)

      expect(response.body.name).toBe('Plan Nómina')
      expect(response.body.color).toBe('#4CAF50')
      expect(response.body.amount).toBe(0)
      expect(response.body.total).toBe(0)
    })

    test('PATCH /:id edits the plan color', async () => {
      const created = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan', color: '#4CAF50' })

      const response = await supertest(server.app)
        .patch(`${path}/${created.body.id}`)
        .auth(token, { type: 'bearer' })
        .send({ color: '#2196F3' })
        .expect(200)

      expect(response.body.color).toBe('#2196F3')
      expect(response.body.name).toBe('Plan')
    })

    test('GET / returns every plan of the user', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan A', color: '#4CAF50' })
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan B', color: '#4CAF50' })

      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body.map((plan: { name: string }) => plan.name).sort()).toEqual(['Plan A', 'Plan B'])
    })

    test('PATCH /:id edits the plan name', async () => {
      const created = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Old name', color: '#4CAF50' })

      const response = await supertest(server.app)
        .patch(`${path}/${created.body.id}`)
        .auth(token, { type: 'bearer' })
        .send({ name: 'New name', color: '#4CAF50' })
        .expect(200)

      expect(response.body.name).toBe('New name')
    })

    test('GET /:id for a non-existent plan returns 404', async () => {
      await supertest(server.app)
        .get(`${path}/nonexistent-id`)
        .auth(token, { type: 'bearer' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.PENSION_PLAN.NOT_FOUND)
        })
    })

    test('DELETE /:id deletes the plan', async () => {
      const created = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'To delete', color: '#4CAF50' })

      await supertest(server.app)
        .delete(`${path}/${created.body.id}`)
        .auth(token, { type: 'bearer' })
        .expect(204)

      await supertest(server.app)
        .get(`${path}/${created.body.id}`)
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('a plan from another user is not reachable', async () => {
      const otherUser = generateUsername()
      const otherToken = await requestLogin(server.app, { username: otherUser })
      const created = await supertest(server.app).post(path).auth(otherToken, { type: 'bearer' }).send({ name: 'Rogue plan', color: '#4CAF50' })

      await supertest(server.app)
        .get(`${path}/${created.body.id}`)
        .auth(token, { type: 'bearer' })
        .expect(404)

      sqliteDb.delete(pensionPlans).where(eq(pensionPlans.user, otherUser)).run()
    })
  })

  describe('Movements', () => {
    const movementPayload = {
      date: 1700000000000,
      employeeAmount: 50,
      employeeUnits: 5,
      companyAmount: 100,
      companyUnits: 10,
      value: 20
    }

    test('POST /:id/movements with missing fields returns 422', async () => {
      const plan = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan', color: '#4CAF50' })

      await supertest(server.app)
        .post(`${path}/${plan.body.id}/movements`)
        .auth(token, { type: 'bearer' })
        .send({ date: 1000 })
        .expect(422)
    })

    test('add movements and see them aggregated on the plan', async () => {
      const plan = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan', color: '#4CAF50' })
      const planId = plan.body.id

      await supertest(server.app)
        .post(`${path}/${planId}/movements`)
        .auth(token, { type: 'bearer' })
        .send({ ...movementPayload, date: 1000, value: 10 })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${planId}/movements`)
        .auth(token, { type: 'bearer' })
        .send({ ...movementPayload, date: 2000, value: 15 })
        .expect(201)

      const detail = await supertest(server.app).get(`${path}/${planId}`).auth(token, { type: 'bearer' }).expect(200)

      expect(detail.body.employeeAmount).toBe(100)
      expect(detail.body.companyAmount).toBe(200)
      expect(detail.body.amount).toBe(300)
      expect(detail.body.units).toBe(30)
      // total = value of the latest movement (15) * total units (30)
      expect(detail.body.total).toBe(450)

      const movements = await supertest(server.app).get(`${path}/${planId}/movements`).auth(token, { type: 'bearer' }).expect(200)
      expect(movements.body).toHaveLength(2)
      expect(movements.body[0].date).toBe(2000)
      expect(movements.body[0].planId).toBe(planId)
    })

    test('PATCH /:id/movements/:movementId partially edits a movement', async () => {
      const plan = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan', color: '#4CAF50' })
      const movement = await supertest(server.app)
        .post(`${path}/${plan.body.id}/movements`)
        .auth(token, { type: 'bearer' })
        .send(movementPayload)
        .expect(201)

      const response = await supertest(server.app)
        .patch(`${path}/${plan.body.id}/movements/${movement.body.id}`)
        .auth(token, { type: 'bearer' })
        .send({ value: 99 })
        .expect(200)

      expect(response.body.value).toBe(99)
      expect(response.body.employeeAmount).toBe(movementPayload.employeeAmount)
    })

    test('DELETE /:id/movements/:movementId deletes a movement', async () => {
      const plan = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan', color: '#4CAF50' })
      const movement = await supertest(server.app)
        .post(`${path}/${plan.body.id}/movements`)
        .auth(token, { type: 'bearer' })
        .send(movementPayload)
        .expect(201)

      await supertest(server.app)
        .delete(`${path}/${plan.body.id}/movements/${movement.body.id}`)
        .auth(token, { type: 'bearer' })
        .expect(204)

      const movements = await supertest(server.app).get(`${path}/${plan.body.id}/movements`).auth(token, { type: 'bearer' }).expect(200)
      expect(movements.body).toHaveLength(0)
    })

    test('using a movement id under another plan returns 404', async () => {
      const planA = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan A', color: '#4CAF50' })
      const planB = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan B', color: '#4CAF50' })

      const movement = await supertest(server.app)
        .post(`${path}/${planA.body.id}/movements`)
        .auth(token, { type: 'bearer' })
        .send(movementPayload)
        .expect(201)

      await supertest(server.app)
        .patch(`${path}/${planB.body.id}/movements/${movement.body.id}`)
        .auth(token, { type: 'bearer' })
        .send({ value: 1 })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.PENSION_PLAN.MOVEMENT_NOT_FOUND)
        })
    })

    test('GET /movements returns movements across every plan of the user, most recent first', async () => {
      const planA = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan A', color: '#4CAF50' })
      const planB = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan B', color: '#4CAF50' })

      await supertest(server.app)
        .post(`${path}/${planA.body.id}/movements`)
        .auth(token, { type: 'bearer' })
        .send({ ...movementPayload, date: 1000 })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${planB.body.id}/movements`)
        .auth(token, { type: 'bearer' })
        .send({ ...movementPayload, date: 2000 })
        .expect(201)

      const response = await supertest(server.app).get(`${path}/movements`).auth(token, { type: 'bearer' }).expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body[0].planId).toBe(planB.body.id)
      expect(response.body[1].planId).toBe(planA.body.id)
    })

    test('deleting a plan cascades its movements', async () => {
      const plan = await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({ name: 'Plan', color: '#4CAF50' })
      await supertest(server.app)
        .post(`${path}/${plan.body.id}/movements`)
        .auth(token, { type: 'bearer' })
        .send(movementPayload)
        .expect(201)

      await supertest(server.app).delete(`${path}/${plan.body.id}`).auth(token, { type: 'bearer' }).expect(204)

      const remaining = sqliteDb.select().from(pensions).where(eq(pensions.planId, plan.body.id)).all()
      expect(remaining).toHaveLength(0)
    })
  })
})
