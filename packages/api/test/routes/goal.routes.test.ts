import supertest from 'supertest'
import {
  mongoose,
  GoalModel,
  GOAL_COLORS,
  GOAL_ICONS
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertGoal, insertAccount } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Goal', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /', () => {
    const path = '/api/goals'
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test.each(['name', 'targetAmount', 'color', 'icon'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, string | number> = {
        name: faker.lorem.words(2),
        targetAmount: faker.number.int({ min: 100, max: 10000 }),
        color: faker.helpers.arrayElement(GOAL_COLORS),
        icon: faker.helpers.arrayElement(GOAL_ICONS)
      }

      delete params[param]
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when success creating a goal, it should return the goal', async () => {
      const res = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: faker.lorem.words(2),
          targetAmount: faker.number.int({ min: 100, max: 10000 }),
          color: faker.helpers.arrayElement(GOAL_COLORS),
          icon: faker.helpers.arrayElement(GOAL_ICONS)
        })
        .expect(200)

      expect(res.body.name).toBeDefined()
      expect(res.body.targetAmount).toBeDefined()
      expect(res.body.currentAmount).toBe(0)
    })

    test('when currentAmount exceeds total balance, it should response an error with status code 400', async () => {
      await insertAccount({ user: 'testuser', balance: 50, isActive: true })
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: faker.lorem.words(2),
          targetAmount: 1000,
          currentAmount: 500,
          color: faker.helpers.arrayElement(GOAL_COLORS),
          icon: faker.helpers.arrayElement(GOAL_ICONS)
        })
        .expect(400)
    })
  })

  describe('GET /', () => {
    const path = '/api/goals'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no goals, it should return an empty array', async () => {
      const res = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toEqual([])
    })

    test('when there are goals, it should return them', async () => {
      await insertGoal({ user })

      const res = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body.length).toBeGreaterThan(0)
    })
  })

  describe('GET /:id', () => {
    const path = '/api/goals'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when id is not valid, it should response an error with status code 400', async () => {
      await supertest(server.app)
        .get(`${path}/invalid-id`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })

    test('when goal does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app)
        .get(`${path}/000000000000000000000000`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    test('when goal exists, it should return the goal', async () => {
      const goal = await insertGoal({ user })

      const res = await supertest(server.app)
        .get(`${path}/${goal._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body.name).toBe(goal.name)
    })
  })

  describe('PUT /:id', () => {
    const path = '/api/goals'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).put(`${path}/some-id`).expect(401)
    })

    test('when id is not valid, it should response an error with status code 400', async () => {
      await supertest(server.app)
        .put(`${path}/invalid-id`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'new name' })
        .expect(400)
    })

    test('when goal does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app)
        .put(`${path}/000000000000000000000000`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'new name' })
        .expect(404)
    })

    test('when success editing a goal, it should return the updated goal', async () => {
      const goal = await insertGoal({ user })
      const newName = faker.lorem.words(3)

      const res = await supertest(server.app)
        .put(`${path}/${goal._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: newName })
        .expect(200)

      expect(res.body.name).toBe(newName)
    })

    test('when editing currentAmount that exceeds total balance, it should response an error with status code 400', async () => {
      await insertAccount({ user, balance: 50, isActive: true })
      const goal = await insertGoal({ user, currentAmount: 0, targetAmount: 1000 })

      await supertest(server.app)
        .put(`${path}/${goal._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ currentAmount: 500 })
        .expect(400)
    })
  })

  describe('DELETE /:id', () => {
    const path = '/api/goals'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).delete(`${path}/some-id`).expect(401)
    })

    test('when id is not valid, it should response an error with status code 400', async () => {
      await supertest(server.app)
        .delete(`${path}/invalid-id`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })

    test('when goal does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app)
        .delete(`${path}/000000000000000000000000`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    test('when success deleting a goal, it should return 204', async () => {
      const goal = await insertGoal({ user })

      await supertest(server.app)
        .delete(`${path}/${goal._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const exists = await GoalModel.exists({ _id: goal._id })
      expect(exists).toBeNull()
    })
  })

  describe('POST /:id/fund', () => {
    const path = '/api/goals'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(`${path}/some-id/fund`).expect(401)
    })

    test('when id is not valid, it should response an error with status code 400', async () => {
      await supertest(server.app)
        .post(`${path}/invalid-id/fund`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 })
        .expect(400)
    })

    test('when no amount provided, it should response an error with status code 422', async () => {
      const goal = await insertGoal({ user })

      await supertest(server.app)
        .post(`${path}/${goal._id}/fund`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(422)
    })

    test('when amount is not positive, it should response an error with status code 422', async () => {
      const goal = await insertGoal({ user })

      await supertest(server.app)
        .post(`${path}/${goal._id}/fund`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -10 })
        .expect(422)
    })

    test('when total allocation exceeds balance, it should response an error with status code 400', async () => {
      const goal = await insertGoal({ user, currentAmount: 0 })

      await supertest(server.app)
        .post(`${path}/${goal._id}/fund`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 999999 })
        .expect(400)
    })

    test('when success funding a goal, it should return the updated goal', async () => {
      await insertAccount({ user, balance: 1000, isActive: true })
      const goal = await insertGoal({ user, currentAmount: 0, targetAmount: 1000 })

      const res = await supertest(server.app)
        .post(`${path}/${goal._id}/fund`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 })
        .expect(200)

      expect(res.body.currentAmount).toBe(100)
    })
  })

  describe('POST /:id/withdraw', () => {
    const path = '/api/goals'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(`${path}/some-id/withdraw`).expect(401)
    })

    test('when id is not valid, it should response an error with status code 400', async () => {
      await supertest(server.app)
        .post(`${path}/invalid-id/withdraw`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 })
        .expect(400)
    })

    test('when withdrawing more than currentAmount, it should response an error with status code 400', async () => {
      await insertAccount({ user, balance: 1000, isActive: true })
      const goal = await insertGoal({ user, currentAmount: 100, targetAmount: 1000 })

      await supertest(server.app)
        .post(`${path}/${goal._id}/withdraw`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 200 })
        .expect(400)
    })

    test('when success withdrawing from a goal, it should return the updated goal', async () => {
      await insertAccount({ user, balance: 1000, isActive: true })
      const goal = await insertGoal({ user, currentAmount: 100, targetAmount: 1000 })

      const res = await supertest(server.app)
        .post(`${path}/${goal._id}/withdraw`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 50 })
        .expect(200)

      expect(res.body.currentAmount).toBe(50)
    })
  })
})
