import supertest from 'supertest'
import { faker } from '@faker-js/faker'
import { SupplyModel, PropertyModel, SupplyReadingModel, mongoose, SUPPLY_TYPE } from '@soker90/finper-models'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertSupply, insertProperty, insertSupplyReading } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

const MOCK_TARIFFS_RESPONSE = {
  datosGenerales: { iva: 0.21, impuestoElectrico: 0.0511269632, alquilerContador: 0.026557 },
  tarifas: [
    {
      comercializadora: 'Test Comercializadora',
      detalles: {
        nombreTarifa: 'Tarifa Test',
        potenciaPunta: 0.1,
        potenciaValle: 0.05,
        periodos: 3,
        energiaPunta: 0.15,
        energiaLlana: 0.12,
        energiaValle: 0.08
      }
    }
  ]
}

const FULL_PRICE_SUPPLY = {
  type: SUPPLY_TYPE.ELECTRICITY,
  contractedPowerPeak: 3.45,
  contractedPowerOffPeak: 3.45,
  currentPricePowerPeak: 0.104229,
  currentPricePowerOffPeak: 0.053479,
  currentPriceEnergyPeak: 0.157316,
  currentPriceEnergyFlat: 0.130024,
  currentPriceEnergyOffPeak: 0.090212
}

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

  describe('GET /api/supplies/:id/tariffs-comparison', () => {
    const path = (id: string) => `/api/supplies/${id}/tariffs-comparison`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => MOCK_TARIFFS_RESPONSE
      } as Response)
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    test('when token is not provided, it should respond 401', async () => {
      const supply = await insertSupply({ user })
      await supertest(server.app).get(path(supply._id.toString())).expect(401)
    })

    test('when supply does not exist, it should respond 404', async () => {
      await supertest(server.app)
        .get(path(faker.database.mongodbObjectId()))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when supply belongs to another user, it should respond 404', async () => {
      const supply = await insertSupply()
      await supertest(server.app)
        .get(path(supply._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when supply is not electricity type, it should respond 400', async () => {
      const supply = await insertSupply({ user, type: SUPPLY_TYPE.WATER })
      await supertest(server.app)
        .get(path(supply._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(400)
    })

    test('when supply has no contracted power configured, it should respond 400', async () => {
      const supply = await insertSupply({ user, type: SUPPLY_TYPE.ELECTRICITY })
      await supertest(server.app)
        .get(path(supply._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(400)
    })

    test('when supply has no current prices configured, it should respond 400', async () => {
      const supply = await insertSupply({
        user,
        type: SUPPLY_TYPE.ELECTRICITY,
        contractedPowerPeak: 3.45,
        contractedPowerOffPeak: 3.45
      })
      await supertest(server.app)
        .get(path(supply._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(400)
    })

    test('when supply has no readings, it should respond 400', async () => {
      const supply = await insertSupply({ user, ...FULL_PRICE_SUPPLY })
      await supertest(server.app)
        .get(path(supply._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(400)
    })

    test('when success, returns comparison array sorted by savings descending', async () => {
      const endDate = Date.now()
      const startDate = endDate - 30 * 24 * 60 * 60 * 1000

      const supply = await insertSupply({ user, ...FULL_PRICE_SUPPLY })
      await insertSupplyReading({ user, supplyId: supply._id.toString(), startDate, endDate })

      const { body } = await supertest(server.app)
        .get(path(supply._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(body)).toBeTruthy()
      expect(body.length).toBeGreaterThan(0)
      expect(body[0]).toHaveProperty('retailer')
      expect(body[0]).toHaveProperty('tariffName')
      expect(body[0]).toHaveProperty('estimatedAnnualSavings')
      expect(body[0]).toHaveProperty('invoices')
      expect(Array.isArray(body[0].invoices)).toBeTruthy()
      expect(body[0].invoices[0]).toHaveProperty('realAmount')
      expect(body[0].invoices[0]).toHaveProperty('currentTariffSimulatedAmount')
      expect(body[0].invoices[0]).toHaveProperty('newTariffSimulatedAmount')

      for (let i = 0; i < body.length - 1; i++) {
        expect(body[i].estimatedAnnualSavings).toBeGreaterThanOrEqual(body[i + 1].estimatedAnnualSavings)
      }
    })

    test('when all readings are older than 1 year, it should respond 400', async () => {
      // Para que fetchYearReadings devuelva 0 resultados necesitamos una lectura cuyo
      // endDate sea reciente pero cuyo startDate caiga ANTES de (endDate - 1 año).
      // Así: startDate < lastReading.endDate - ONE_YEAR_MS → no incluida → readings = 0.
      const supply = await insertSupply({ user, ...FULL_PRICE_SUPPLY })
      await insertSupplyReading({
        user,
        supplyId: supply._id.toString(),
        endDate: Date.now(),
        startDate: Date.now() - 366 * 24 * 60 * 60 * 1000 // >365 días antes
      })

      await supertest(server.app)
        .get(path(supply._id.toString()))
        .auth(token, { type: 'bearer' })
        .expect(400)
    })
  })
})
