import supertest from 'supertest'
import { SupplyModel, PropertyModel, SupplyReadingModel, mongoose, SUPPLY_TYPE } from '@soker90/finper-models'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertSupply, insertProperty, insertSupplyReading } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Supply Routes', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())
  afterEach(async () => {
    await SupplyModel.deleteMany({})
    await SupplyReadingModel.deleteMany({})
    await PropertyModel.deleteMany({})
  })

  describe('GET /api/supplies', () => {
    const path = '/api/supplies'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('should return grouped supplies', async () => {
      const property = await insertProperty({ user })
      await insertSupply({ user, propertyId: property._id.toString() })

      const { body } = await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200)

      expect(Array.isArray(body)).toBeTruthy()
      expect(body[0]._id.toString()).toEqual(property._id.toString())
      expect(Array.isArray(body[0].supplies)).toBeTruthy()
      expect(body[0].supplies.length).toBe(1)
    })
  })

  describe('POST /api/supplies', () => {
    const path = '/api/supplies'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when success creating a supply', async () => {
      const property = await insertProperty({ user })
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'Electricidad', type: SUPPLY_TYPE.ELECTRICITY, propertyId: property._id.toString() })
        .expect(200)
    })

    test('when token is not provided, it should respond 401', async () => {
      const property = await insertProperty({ user })
      await supertest(server.app).post(path)
        .send({ name: 'Electricidad', type: SUPPLY_TYPE.ELECTRICITY, propertyId: property._id.toString() })
        .expect(401)
    })

    test('when property does not exist in POST, return 404', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'Agua', type: SUPPLY_TYPE.WATER, propertyId: '662cc99403a45c3453b3bbed' })
        .expect(404)
    })
  })

  describe('PUT /api/supplies/:id', () => {
    const path = (id: string) => `/api/supplies/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when success editing a supply', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).put(path(supply._id.toString())).auth(token, { type: 'bearer' })
        .send({ name: 'Nuevo nombre', type: SUPPLY_TYPE.ELECTRICITY, propertyId: supply.propertyId.toString() })
        .expect(200)
    })

    test('when token is not provided, it should respond 401', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).put(path(supply._id.toString()))
        .send({ name: 'Nuevo nombre', type: SUPPLY_TYPE.ELECTRICITY, propertyId: supply.propertyId.toString() })
        .expect(401)
    })

    test('when supply does not exist in PUT, return 404', async () => {
      const property = await insertProperty({ user })
      await supertest(server.app).put(path('662cc99403a45c3453b3bbed')).auth(token, { type: 'bearer' })
        .send({ name: 'Nuevo nombre', type: SUPPLY_TYPE.ELECTRICITY, propertyId: property._id.toString() })
        .expect(404)
    })

    test('when another user supply in PUT, return 404', async () => {
      const supply = await insertSupply()
      await supertest(server.app).put(path(supply._id.toString())).auth(token, { type: 'bearer' })
        .send({ name: 'Nuevo nombre', type: SUPPLY_TYPE.ELECTRICITY, propertyId: supply.propertyId.toString() })
        .expect(404)
    })
  })

  describe('DELETE /api/supplies/:id', () => {
    const path = (id: string) => `/api/supplies/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when success deleting a supply', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).delete(path(supply._id.toString())).auth(token, { type: 'bearer' }).expect(204)
    })

    test('when token is not provided, it should respond 401', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).delete(path(supply._id.toString())).expect(401)
    })

    test('when supply does not exist in DELETE, return 404', async () => {
      await supertest(server.app).delete(path('662cc99403a45c3453b3bbed')).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when another user supply in DELETE, return 404', async () => {
      const supply = await insertSupply()
      await supertest(server.app).delete(path(supply._id.toString())).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when deleting supply, it should delete related readings', async () => {
      const supply = await insertSupply({ user })
      await insertSupplyReading({ user, supplyId: supply._id.toString(), amount: 15.5 })

      await supertest(server.app).delete(path(supply._id.toString())).auth(token, { type: 'bearer' }).expect(204)

      const readingsCount = await SupplyReadingModel.countDocuments({ supplyId: supply._id })
      expect(readingsCount).toBe(0)
    })
  })
})
