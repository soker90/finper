import { StockModel, STOCK_TYPE, mongoose, IStock } from '@soker90/finper-models'
import StockService from '../../src/services/stock.service'
import { IStockPriceProvider } from '../../src/services/stock-price.provider'
import { insertStock } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

// ── Price provider stub ───────────────────────────────────────────────────────
const makeProvider = (price: number | null = 10): IStockPriceProvider => ({
  getPrice: jest.fn().mockResolvedValue(price)
})

describe('StockService', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())
  afterEach(() => StockModel.deleteMany({}))

  // ── getStocks ─────────────────────────────────────────────────────────────
  describe('getStocks', () => {
    test('returns empty array when user has no stocks', async () => {
      const service = new StockService(makeProvider())
      const result = await service.getStocks(generateUsername())
      expect(result).toEqual([])
    })

    test('returns only positions belonging to the given user', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider(5))

      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 10, price: 4 })
      await insertStock({ ticker: 'ITX.MC', name: 'Inditex', shares: 5, price: 30 }) // otro usuario

      const result = await service.getStocks(user)
      expect(result).toHaveLength(1)
      expect(result[0].ticker).toBe('TEF.MC')
    })

    test('aggregates multiple buys for the same ticker', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider(4.5))

      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy })
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 50, price: 4.2, type: STOCK_TYPE.Buy })

      const result = await service.getStocks(user)
      expect(result).toHaveLength(1)

      const pos = result[0]
      expect(pos.shares).toBe(150)
      expect(pos.totalCost).toBeCloseTo(610, 1)
      expect(pos.avgCost).toBeCloseTo(4.07, 1)
      expect(pos.currentPrice).toBe(4.5)
      expect(pos.currentValue).toBeCloseTo(675, 0)
    })

    test('subtracts shares after a sell operation', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider(5))
      const baseDate = Date.now()

      // Se fijan fechas explícitas para garantizar que la compra precede a la venta
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: baseDate - 2000 })
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 40, price: 5.0, type: STOCK_TYPE.Sell, date: baseDate - 1000 })

      const result = await service.getStocks(user)
      expect(result).toHaveLength(1)
      expect(result[0].shares).toBe(60)
    })

    test('excludes position when all shares have been sold', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider(5))
      const baseDate = Date.now()

      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy, date: baseDate - 2000 })
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 5.0, type: STOCK_TYPE.Sell, date: baseDate - 1000 })

      const result = await service.getStocks(user)
      expect(result).toHaveLength(0)
    })

    test('counts dividend shares separately', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider(5))

      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4.0, type: STOCK_TYPE.Buy })
      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 5, price: 0, type: STOCK_TYPE.Dividend })

      const result = await service.getStocks(user)
      expect(result[0].shares).toBe(105)
      expect(result[0].dividendShares).toBe(5)
    })

    test('currentValue and gainLoss are null when price provider returns null', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider(null))

      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 10, price: 4, type: STOCK_TYPE.Buy })

      const result = await service.getStocks(user)
      expect(result[0].currentValue).toBeNull()
      expect(result[0].gainLoss).toBeNull()
      expect(result[0].gainLossPct).toBeNull()
    })
  })

  // ── addStock ──────────────────────────────────────────────────────────────
  describe('addStock', () => {
    test('persists and returns the new stock', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider())

      const payload: IStock = {
        ticker: 'SAN.MC',
        name: 'Santander',
        shares: 200,
        price: 3.5,
        type: STOCK_TYPE.Buy,
        date: Date.now(),
        platform: 'DEGIRO',
        user
      } as unknown as IStock

      const created = await service.addStock(payload)
      expect(created.ticker).toBe('SAN.MC')
      expect(created.shares).toBe(200)

      const inDb = await StockModel.findOne({ ticker: 'SAN.MC', user })
      expect(inDb).not.toBeNull()
    })
  })

  // ── deleteStock ───────────────────────────────────────────────────────────
  describe('deleteStock', () => {
    test('removes the document from the collection', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider())
      const stock = await insertStock({ user })

      await service.deleteStock(stock._id.toString(), user)

      const inDb = await StockModel.findById(stock._id)
      expect(inDb).toBeNull()
    })

    test('does not delete a stock belonging to another user', async () => {
      const user = generateUsername()
      const otherUser = generateUsername()
      const service = new StockService(makeProvider())
      const stock = await insertStock({ user: otherUser })

      await service.deleteStock(stock._id.toString(), user)

      const inDb = await StockModel.findById(stock._id)
      expect(inDb).not.toBeNull()
    })
  })

  // ── getStocksSummary ──────────────────────────────────────────────────────
  describe('getStocksSummary', () => {
    test('returns totalCost 0 and totalValue 0 when no positions', async () => {
      const service = new StockService(makeProvider(10))
      const result = await service.getStocksSummary(generateUsername())
      expect(result.totalCost).toBe(0)
      expect(result.totalValue).toBe(0)
    })

    test('returns correct totalCost and totalValue when all prices available', async () => {
      const user = generateUsername()
      const service = new StockService(makeProvider(10))

      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4, type: STOCK_TYPE.Buy })
      await insertStock({ user, ticker: 'ITX.MC', name: 'Inditex', shares: 2, price: 50, type: STOCK_TYPE.Buy })

      const result = await service.getStocksSummary(user)
      // totalCost = 100*4 + 2*50 = 500
      expect(result.totalCost).toBeCloseTo(500, 0)
      // totalValue = (100 + 2) * 10 = 1020
      expect(result.totalValue).toBeCloseTo(1020, 0)
    })

    test('returns totalValue null when any position has no price', async () => {
      const user = generateUsername()
      const provider: IStockPriceProvider = {
        getPrice: jest.fn()
          .mockResolvedValueOnce(10) // TEF.MC
          .mockResolvedValueOnce(null) // ITX.MC
      }
      const service = new StockService(provider)

      await insertStock({ user, ticker: 'TEF.MC', name: 'Telefónica', shares: 100, price: 4, type: STOCK_TYPE.Buy })
      await insertStock({ user, ticker: 'ITX.MC', name: 'Inditex', shares: 2, price: 50, type: STOCK_TYPE.Buy })

      const result = await service.getStocksSummary(user)
      expect(result.totalValue).toBeNull()
    })
  })
})
