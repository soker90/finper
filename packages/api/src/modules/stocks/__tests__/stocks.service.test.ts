import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createStocksRepository } from '../stocks.repository'
import { StockService } from '../stocks.service'
import { STOCK_TYPE } from '../stocks.validators'
import { schema, generateId } from '@soker90/finper-db'

describe('StocksService', () => {
  let testDb: any
  let stocksRepository: any
  let stocksService: any
  let mockProvider: any

  const username = 'testuser'

  const makeProvider = (price: number | null = 10) => ({
    getPrice: jest.fn().mockResolvedValue(price)
  })

  beforeEach(() => {
    testDb = createTestDb()
    stocksRepository = createStocksRepository(testDb)
    const users = schema.users
    testDb.insert(users).values([
      { id: generateId(), username, password: 'pwd', createdAt: new Date() },
      { id: generateId(), username: 'other', password: 'pwd', createdAt: new Date() }
    ]).run()
  })

  afterEach(() => {
    closeTestDb(testDb)
  })

  describe('getStocks', () => {
    test('returns empty array when user has no stocks', async () => {
      mockProvider = makeProvider(10)
      stocksService = new StockService(mockProvider, stocksRepository)
      const result = await stocksService.getStocks(username)
      expect(result).toEqual([])
    })

    test('returns only positions belonging to the given user', async () => {
      mockProvider = makeProvider(5)
      stocksService = new StockService(mockProvider, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 10, price: 4, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })
      stocksRepository.create({ user: 'other', ticker: 'ITX.MC', name: 'Inditex', shares: 5, price: 30, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })

      const result = await stocksService.getStocks(username)
      expect(result).toHaveLength(1)
      expect(result[0].ticker).toBe('TEF.MC')
    })

    test('aggregates multiple buys for the same ticker', async () => {
      mockProvider = makeProvider(4.5)
      stocksService = new StockService(mockProvider, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: 1000, platform: 'DEGIRO' })
      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 50, price: 4.2, type: STOCK_TYPE.Buy, date: 2000, platform: 'DEGIRO' })

      const result = await stocksService.getStocks(username)
      expect(result).toHaveLength(1)

      const pos = result[0]
      expect(pos.shares).toBe(150)
      expect(pos.totalCost).toBeCloseTo(610, 1)
      expect(pos.avgCost).toBeCloseTo(4.07, 1)
      expect(pos.currentPrice).toBe(4.5)
      expect(pos.currentValue).toBeCloseTo(675, 0)
    })

    test('subtracts shares after a sell operation', async () => {
      mockProvider = makeProvider(5)
      stocksService = new StockService(mockProvider, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: 1000, platform: 'DEGIRO' })
      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 40, price: 5.0, type: STOCK_TYPE.Sell, date: 2000, platform: 'DEGIRO' })

      const result = await stocksService.getStocks(username)
      expect(result).toHaveLength(1)
      expect(result[0].shares).toBe(60)
    })

    test('excludes position when all shares have been sold', async () => {
      mockProvider = makeProvider(5)
      stocksService = new StockService(mockProvider, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: 1000, platform: 'DEGIRO' })
      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 5.0, type: STOCK_TYPE.Sell, date: 2000, platform: 'DEGIRO' })

      const result = await stocksService.getStocks(username)
      expect(result).toHaveLength(0)
    })

    test('counts dividend shares separately', async () => {
      mockProvider = makeProvider(5)
      stocksService = new StockService(mockProvider, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: 1000, platform: 'DEGIRO' })
      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 5, price: 0, type: STOCK_TYPE.Dividend, date: 2000, platform: 'DEGIRO' })

      const result = await stocksService.getStocks(username)
      expect(result[0].shares).toBe(105)
      expect(result[0].dividendShares).toBe(5)
    })

    test('currentValue and gainLoss are null when price provider returns null', async () => {
      mockProvider = makeProvider(null)
      stocksService = new StockService(mockProvider, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 10, price: 4, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })

      const result = await stocksService.getStocks(username)
      expect(result[0].currentValue).toBeNull()
      expect(result[0].gainLoss).toBeNull()
      expect(result[0].gainLossPct).toBeNull()
    })
  })

  describe('addStock', () => {
    test('persists and returns the new stock', async () => {
      mockProvider = makeProvider(10)
      stocksService = new StockService(mockProvider, stocksRepository)

      const payload = {
        user: username,
        ticker: 'SAN.MC',
        name: 'Santander',
        shares: 200,
        price: 3.5,
        type: STOCK_TYPE.Buy,
        date: Date.now(),
        platform: 'DEGIRO',
      }

      const created = await stocksService.addStock(payload)
      expect(created.ticker).toBe('SAN.MC')
      expect(created.shares).toBe(200)

      const inDb = stocksRepository.findAllByUser(username)
      expect(inDb).toHaveLength(1)
      expect(inDb[0].ticker).toBe('SAN.MC')
    })
  })

  describe('deleteStock', () => {
    test('removes the document from the collection', async () => {
      mockProvider = makeProvider(10)
      stocksService = new StockService(mockProvider, stocksRepository)

      const stock = stocksRepository.create({ user: username, ticker: 'SAN.MC', name: 'Santander', shares: 200, price: 3.5, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })

      await stocksService.deleteStock(stock.id, username)

      const inDb = stocksRepository.findAllByUser(username)
      expect(inDb).toHaveLength(0)
    })

    test('does not delete a stock belonging to another user', async () => {
      mockProvider = makeProvider(10)
      stocksService = new StockService(mockProvider, stocksRepository)

      const otherUser = 'other'
      const stock = stocksRepository.create({ user: otherUser, ticker: 'SAN.MC', name: 'Santander', shares: 200, price: 3.5, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })

      await stocksService.deleteStock(stock.id, username)

      const inDb = stocksRepository.findAllByUser(otherUser)
      expect(inDb).toHaveLength(1)
    })
  })

  describe('getStocksSummary', () => {
    test('returns totalCost 0 and totalValue 0 when no positions', async () => {
      mockProvider = makeProvider(10)
      stocksService = new StockService(mockProvider, stocksRepository)
      const result = await stocksService.getStocksSummary(username)
      expect(result.totalCost).toBe(0)
      expect(result.totalValue).toBe(0)
    })

    test('returns correct totalCost and totalValue when all prices available', async () => {
      mockProvider = makeProvider(10)
      stocksService = new StockService(mockProvider, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })
      stocksRepository.create({ user: username, ticker: 'ITX.MC', name: 'Inditex', shares: 2, price: 50, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })

      const result = await stocksService.getStocksSummary(username)
      // totalCost = 100*4 + 2*50 = 500
      expect(result.totalCost).toBeCloseTo(500, 0)
      // totalValue = (100 + 2) * 10 = 1020
      expect(result.totalValue).toBeCloseTo(1020, 0)
    })

    test('returns totalValue null when any position has no price', async () => {
      mockProvider = {
        getPrice: jest.fn()
          .mockResolvedValueOnce(10) // TEF.MC
          .mockResolvedValueOnce(null) // ITX.MC
      }
      stocksService = new StockService(mockProvider, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })
      stocksRepository.create({ user: username, ticker: 'ITX.MC', name: 'Inditex', shares: 2, price: 50, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })

      const result = await stocksService.getStocksSummary(username)
      expect(result.totalValue).toBeNull()
    })
  })
})
