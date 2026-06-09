import supertest from 'supertest'
import { db as sqliteDb } from '../../src/db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertProperty, insertSupply, insertSupplyReading } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'


describe('Property Routes', () => {
  afterEach(() => {
    sqliteDb.delete(schema.supplyReadings).run()
    sqliteDb.delete(schema.supplies).run()
    sqliteDb.delete(schema.properties).run()
  })

  describe('POST /api/supplies/properties', () => {
    const path = '/api/supplies/properties'
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when missing name param, it should return 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).send({}).expect(422)
    })

    test('when success creating a property', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' })
        .send({ name: 'Mi casa' })
        .expect(200)
    })
  })

  describe('PUT /api/supplies/properties/:id', () => {
    const path = (id: string) => `/api/supplies/properties/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when property does not exist, it should return 404', async () => {
      await supertest(server.app).put(path('662cc99403a45c3453b3bbed')).auth(token, { type: 'bearer' }).send({ name: 'casa' }).expect(404)
    })

    test('when another user property, it should return 404', async () => {
      const property = await insertProperty()
      await supertest(server.app).put(path(property.id)).auth(token, { type: 'bearer' }).send({ name: 'casa' }).expect(404)
    })

    test('when success editing a property', async () => {
      const property = await insertProperty({ user })
      await supertest(server.app).put(path(property.id)).auth(token, { type: 'bearer' })
        .send({ name: 'Mi chalet' })
        .expect(200)
    })
  })

  describe('DELETE /api/supplies/properties/:id', () => {
    const path = (id: string) => `/api/supplies/properties/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when property does not exist, it should return 404', async () => {
      await supertest(server.app).delete(path('662cc99403a45c3453b3bbed')).auth(token, { type: 'bearer' }).expect(404)
    })

    test('when success deleting a property', async () => {
      const property = await insertProperty({ user })
      await supertest(server.app).delete(path(property.id)).auth(token, { type: 'bearer' }).expect(204)
    })

    test('when deleting property, it should delete related supplies and readings', async () => {
      const property = await insertProperty({ user })
      const supply = await insertSupply({ user, propertyId: property.id })
      await insertSupplyReading({ user, supplyId: supply.id, amount: 12.45 })

      await supertest(server.app).delete(path(property.id)).auth(token, { type: 'bearer' }).expect(204)

      const suppliesCount = sqliteDb.select().from(schema.supplies).where(eq(schema.supplies.propertyId, property.id)).all().length
      const readingsCount = sqliteDb.select().from(schema.supplyReadings).where(eq(schema.supplyReadings.supplyId, supply.id)).all().length

      expect(suppliesCount).toBe(0)
      expect(readingsCount).toBe(0)
    })
  })
})
