import supertest from 'supertest'
import { SupplyReadingModel, SupplyModel, mongoose } from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertSupplyReading, insertSupply } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

const buildReadingPayload = (overrides: Record<string, unknown> = {}) => {
  const startDate = faker.date.past().getTime()
  const endDate = faker.date.soon({ days: 30, refDate: new Date(startDate) }).getTime()

  return {
    startDate,
    endDate,
    amount: faker.number.float({ min: -50, max: 250, multipleOf: 0.01 }),
    consumption: faker.number.int({ min: 10, max: 1000 }),
    ...overrides
  }
}

describe('SupplyReading Routes', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())
  afterEach(async () => {
    await SupplyReadingModel.deleteMany({})
    await SupplyModel.deleteMany({})
  })

  describe('GET /api/supplies/readings/supply/:supplyId', () => {
    const path = (supplyId: string) => `/api/supplies/readings/supply/${supplyId}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('returns 404 when supply does not exist', async () => {
      await supertest(server.app).get(path(faker.database.mongodbObjectId())).auth(token, { type: 'bearer' }).expect(404)
    })

    test('successfully returns array of readings', async () => {
      const supply = await insertSupply({ user })
      await insertSupplyReading({ user, supplyId: supply._id.toString() })

      const { body } = await supertest(server.app).get(path(supply._id.toString())).auth(token, { type: 'bearer' }).expect(200)
      expect(Array.isArray(body)).toBeTruthy()
      expect(body.length).toBe(1)
    })
  })

  describe('POST /api/supplies/readings', () => {
    const path = '/api/supplies/readings'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('missing required arguments return 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({})
        .expect(422)
    })

    test('success creating reading', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(buildReadingPayload({ supplyId: supply._id.toString() }))
        .expect(200)
    })

    test('when token is not provided, it should respond 401', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).post(path)
        .send(buildReadingPayload({ supplyId: supply._id.toString() }))
        .expect(401)
    })

    test('missing amount returns 422', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(buildReadingPayload({ supplyId: supply._id.toString(), amount: undefined }))
        .expect(422)
    })

    test('invalid amount type returns 422', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send(buildReadingPayload({ supplyId: supply._id.toString(), amount: faker.word.noun() }))
        .expect(422)
    })
  })

  describe('PUT /api/supplies/readings/:id', () => {
    const path = (id: string) => `/api/supplies/readings/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('success updating reading', async () => {
      const reading = await insertSupplyReading({ user })
      await supertest(server.app).put(path(reading._id.toString())).auth(token, { type: 'bearer' })
        .send(buildReadingPayload({ supplyId: reading.supplyId.toString() }))
        .expect(200)
    })

    test('when token is not provided, it should respond 401', async () => {
      const reading = await insertSupplyReading({ user })
      await supertest(server.app).put(path(reading._id.toString()))
        .send(buildReadingPayload({ supplyId: reading.supplyId.toString() }))
        .expect(401)
    })

    test('when reading does not exist in PUT, return 404', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).put(path(faker.database.mongodbObjectId())).auth(token, { type: 'bearer' })
        .send(buildReadingPayload({ supplyId: supply._id.toString() }))
        .expect(404)
    })

    test('when another user reading in PUT, return 404', async () => {
      const reading = await insertSupplyReading()
      await supertest(server.app).put(path(reading._id.toString())).auth(token, { type: 'bearer' })
        .send(buildReadingPayload({ supplyId: reading.supplyId.toString() }))
        .expect(404)
    })

    test('missing amount in PUT returns 422', async () => {
      const reading = await insertSupplyReading({ user })
      await supertest(server.app).put(path(reading._id.toString())).auth(token, { type: 'bearer' })
        .send(buildReadingPayload({ supplyId: reading.supplyId.toString(), amount: undefined }))
        .expect(422)
    })
  })

  describe('DELETE /api/supplies/readings/:id', () => {
    const path = (id: string) => `/api/supplies/readings/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('success deleting reading', async () => {
      const reading = await insertSupplyReading({ user })
      await supertest(server.app).delete(path(reading._id.toString())).auth(token, { type: 'bearer' }).expect(204)
    })

    test('when token is not provided, it should respond 401', async () => {
      const reading = await insertSupplyReading({ user })
      await supertest(server.app).delete(path(reading._id.toString())).expect(401)
    })

    test('when reading does not exist in DELETE, return 404', async () => {
      await supertest(server.app).delete(path(faker.database.mongodbObjectId())).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when another user reading in DELETE, return 404', async () => {
      const reading = await insertSupplyReading()
      await supertest(server.app).delete(path(reading._id.toString())).auth(token, { type: 'bearer' }).expect(404)
    })
  })
})
