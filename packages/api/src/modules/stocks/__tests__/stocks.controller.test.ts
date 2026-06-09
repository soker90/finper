import supertest from 'supertest'
import { eq } from 'drizzle-orm'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
const { stocks } = schema

import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { insertCredentials } from '../../../../test/insert-data-to-model'
import { stocksRepository } from '../stocks.repository'
import { STOCK_TYPE } from '../stocks.validators'

// Mock the price provider so tests don't depend on real network calls
jest.mock('../stock-price.provider', () => ({
  YahooPriceProvider: jest.fn().mockImplementation(() => ({
    getPrice: jest.fn().mockResolvedValue(4.5)
  })),
  IStockPriceProvider: {}
}))

describe('Stocks Controller', () => {
  const username = generateUsername()
  let token: string

  beforeAll(async () => {
    token = await requestLogin(server.app, { username })
  })

  afterAll(async () => {
    sqliteDb.delete(schema.users).where(eq(schema.users.username, username)).run()
  })

  afterEach(() => {
    sqliteDb.delete(stocks).where(eq(stocks.user, username)).run()
  })

  describe('GET /api/stocks', () => {
    const path = '/api/stocks'

    it('when token is not provided, it should response 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    it('when there are no stocks, it should return an empty array', async () => {
      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return aggregated positions by ticker', async () => {
      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: new Date(1), platform: 'X' })
      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 50, price: 4.2, type: STOCK_TYPE.Buy, date: new Date(2), platform: 'X' })

      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
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
      // Check serialization uses _id
      expect(pos.purchases[0]).toHaveProperty('_id')
    })

    it('stocks of other users should not be included', async () => {
      const otherUser = generateUsername()
      await insertCredentials({ username: otherUser })

      sqliteDb.insert(stocks).values({ id: generateId(), user: otherUser, ticker: 'ITX.MC', name: 'Inditex', shares: 10, price: 50, type: STOCK_TYPE.Buy, date: new Date(1), platform: 'X' }).run()
      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: new Date(1), platform: 'X' })

      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].ticker).toBe('TEF.MC')

      sqliteDb.delete(stocks).where(eq(stocks.user, otherUser)).run()
      sqliteDb.delete(schema.users).where(eq(schema.users.username, otherUser)).run()
    })
  })

  describe('POST /api/stocks', () => {
    const path = '/api/stocks'

    it('when token is not provided, it should response 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    it('should create a stock purchase and return it', async () => {
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
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(200)

      expect(response.body).toHaveProperty('ticker', 'TEF.MC')
      expect(response.body).toHaveProperty('shares', 100)
      expect(response.body).toHaveProperty('type', STOCK_TYPE.Buy)
      expect(response.body).toHaveProperty('platform', 'DEGIRO')
      expect(response.body).toHaveProperty('_id') // From serializer
    })

    it('should return 422 when required fields are missing', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'TEF.MC' })
        .expect(422)
    })
  })

  describe('GET /api/stocks/summary', () => {
    const path = '/api/stocks/summary'

    it('when token is not provided, it should response 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    it('when there are no stocks, it should return totalCost 0 and totalValue 0', async () => {
      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.totalCost).toBe(0)
      expect(response.body.totalValue).toBe(0)
    })

    it('should return aggregated totalCost and totalValue', async () => {
      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: new Date(1), platform: 'X' })

      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(typeof response.body.totalCost).toBe('number')
      expect(response.body.totalCost).toBeCloseTo(400, 0)
      // mocked price provider returns 4.5 → currentValue = 100 * 4.5 = 450
      expect(response.body.totalValue).toBeCloseTo(450, 0)
    })

    it('stocks of other users should not be included in the summary', async () => {
      const otherUser = generateUsername()
      await insertCredentials({ username: otherUser })

      sqliteDb.insert(stocks).values({ id: generateId(), user: otherUser, ticker: 'ITX.MC', name: 'Inditex', shares: 10, price: 50, type: STOCK_TYPE.Buy, date: new Date(1), platform: 'X' }).run()

      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.totalCost).toBe(0)

      sqliteDb.delete(stocks).where(eq(stocks.user, otherUser)).run()
      sqliteDb.delete(schema.users).where(eq(schema.users.username, otherUser)).run()
    })
  })

  describe('DELETE /api/stocks/:id', () => {
    it('when token is not provided, it should response 401', async () => {
      await supertest(server.app).delete('/api/stocks/someId').expect(401)
    })

    it('should delete a stock purchase and return 204', async () => {
      const stock = stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: new Date(1), platform: 'X' })

      await supertest(server.app)
        .delete(`/api/stocks/${stock.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const inDb = stocksRepository.findAllByUser(username)
      expect(inDb).toHaveLength(0)
    })
  })
})
