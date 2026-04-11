import supertest from 'supertest'
import { SupplyReadingModel, SupplyModel, mongoose } from '@soker90/finper-models'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertSupplyReading, insertSupply } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

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
      await supertest(server.app).get(path('662cc99403a45c3453b3bbed')).auth(token, { type: 'bearer' }).expect(404)
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
      const res = await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({
          supplyId: supply._id.toString(),
          startDate: 1000,
          endDate: 2000,
          consumption: 400
        })
        .expect(200)
    })
  })

  describe('PATCH /api/supplies/readings/:id', () => {
    const path = (id: string) => `/api/supplies/readings/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('success updating reading', async () => {
      const reading = await insertSupplyReading({ user })
      await supertest(server.app).patch(path(reading._id.toString())).auth(token, { type: 'bearer' })
        .send({
          supplyId: reading.supplyId.toString(),
          startDate: 1000,
          endDate: 2000,
          consumption: 900
        })
        .expect(200)
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
  })
})
