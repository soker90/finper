import supertest from 'supertest'
import { mongoose, StockModel, STOCK_TYPE } from '@soker90/finper-models'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { insertStock } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

// Mock the price provider so tests don't depend on real network calls
jest.mock('../../src/services/stock-price.provider', () => ({
  YahooPriceProvider: jest.fn().mockImplementation(() => ({
    getPrice: jest.fn().mockResolvedValue(4.5)
  })),
  IStockPriceProvider: {}
}))

const testDatabase = require('../test-db')(mongoose)

describe('Stocks', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())

  describe('GET /stocks', () => {
    const path = '/api/stocks'
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(async () => {
      await StockModel.deleteMany({})
    })

    test('when token is not provided, it should response 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no stocks, it should return an empty array', async () => {
      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toEqual([])
    })

    test('should return aggregated positions by ticker', async () => {
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy })
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 50, price: 4.2, type: STOCK_TYPE.Buy })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(1)

      const pos = response.body[0]
      expect(pos.ticker).toBe('TEF.MC')
      expect(pos.shares).toBe(150)
      // avgCost = (100*4.0 + 50*4.2) / 150 = 610/150 ≈ 4.07
      expect(pos.avgCost).toBeCloseTo(4.07, 1)
      expect(pos.totalCost).toBeCloseTo(610, 1)
      expect(pos.currentPrice).toBe(4.5)
      expect(pos.currentValue).toBeCloseTo(675, 0)
      expect(pos.gainLoss).toBeCloseTo(65, 0)
      expect(typeof pos.gainLossPct).toBe('number')
      expect(Array.isArray(pos.purchases)).toBe(true)
      expect(pos.purchases).toHaveLength(2)
    })

    test('stocks of other users should not be included', async () => {
      await insertStock({ ticker: 'ITX.MC', name: 'Inditex', shares: 10, price: 50, type: STOCK_TYPE.Buy })
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].ticker).toBe('TEF.MC')
    })
  })

  describe('POST /stocks', () => {
    const path = '/api/stocks'
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(async () => {
      await StockModel.deleteMany({})
    })

    test('when token is not provided, it should response 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('should create a stock purchase and return it', async () => {
      const payload = {
        ticker: 'TEF.MC',
        name: 'Telefónica',
        shares: 100,
        price: 4.0,
        type: STOCK_TYPE.Buy,
        date: Date.now(),
        platform: 'DEGIRO'
      }

      const response = await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body).toHaveProperty('ticker', 'TEF.MC')
      expect(response.body).toHaveProperty('shares', 100)
      expect(response.body).toHaveProperty('type', STOCK_TYPE.Buy)
      expect(response.body).toHaveProperty('platform', 'DEGIRO')
    })

    test('should return 422 when required fields are missing', async () => {
      await supertest(server.app)
        .post(path)
        .auth(token, { type: 'bearer' })
        .send({ ticker: 'TEF.MC' })
        .expect(422)
    })
  })

  describe('GET /stocks/summary', () => {
    const path = '/api/stocks/summary'
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(async () => {
      await StockModel.deleteMany({})
    })

    test('when token is not provided, it should response 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when there are no stocks, it should return totalCost 0 and totalValue 0', async () => {
      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.totalCost).toBe(0)
      expect(response.body.totalValue).toBe(0)
    })

    test('should return aggregated totalCost and totalValue', async () => {
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(typeof response.body.totalCost).toBe('number')
      expect(response.body.totalCost).toBeCloseTo(400, 0)
      // mocked price provider returns 4.5 → currentValue = 100 * 4.5 = 450
      expect(response.body.totalValue).toBeCloseTo(450, 0)
    })

    test('stocks of other users should not be included in the summary', async () => {
      await insertStock({ ticker: 'ITX.MC', name: 'Inditex', shares: 10, price: 50, type: STOCK_TYPE.Buy })

      const response = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body.totalCost).toBe(0)
    })
  })

  describe('DELETE /stocks/:id', () => {
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(async () => {
      await StockModel.deleteMany({})
    })

    test('when token is not provided, it should response 401', async () => {
      await supertest(server.app).delete('/api/stocks/someId').expect(401)
    })

    test('should delete a stock purchase and return 204', async () => {
      const stock = await insertStock({ user })

      await supertest(server.app)
        .delete(`/api/stocks/${stock._id}`)
        .auth(token, { type: 'bearer' })
        .expect(204)

      const inDb = await StockModel.findById(stock._id)
      expect(inDb).toBeNull()
    })
  })
})
