import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createStocksRepository } from '../stocks.repository'
import { StockService } from '../stocks.service'
import { STOCK_TYPE } from '../stocks.validators'
import { schema, generateId } from '@soker90/finper-db'

// Unit: these scenarios depend on the price provider returning null, which the
// controller test cannot reproduce (it mocks a fixed price).
describe('StocksService (null-price provider)', () => {
  let testDb: any
  let stocksRepository: any
  let stocksService: any

  const username = 'testuser'

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
    test('currentValue and gainLoss are null when price provider returns null', async () => {
      stocksService = new StockService({ getPrice: jest.fn().mockResolvedValue(null) }, stocksRepository)

      stocksRepository.create({ user: username, ticker: 'TEF.MC', name: 'Telefónica', shares: 10, price: 4, type: STOCK_TYPE.Buy, date: Date.now(), platform: 'DEGIRO' })

      const result = await stocksService.getStocks(username)
      expect(result[0].currentValue).toBeNull()
      expect(result[0].gainLoss).toBeNull()
      expect(result[0].gainLossPct).toBeNull()
    })
  })

  describe('getStocksSummary', () => {
    test('returns totalValue null when any position has no price', async () => {
      const mockProvider = {
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
