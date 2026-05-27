import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createStocksRepository } from '../stocks.repository'
import { STOCK_TYPE } from '../stocks.schema'
import { schema, generateId } from '@soker90/finper-db'

let testDb: any
let stocksRepository: any

describe('Stocks Repository', () => {
  const username = 'testuser'

  beforeEach(() => {
    testDb = createTestDb()
    stocksRepository = createStocksRepository(testDb)
    // Create the required user for foreign key constraints
    const users = schema.users
    testDb.insert(users).values({
      id: generateId(),
      username,
      password: 'pwd',
      createdAt: new Date()
    }).run()
  })

  afterEach(() => {
    closeTestDb(testDb)
  })

  describe('create and findAllByUser', () => {
    it('creates and returns stocks ordered by date', () => {
      stocksRepository.create({
        user: username,
        ticker: 'TEF.MC',
        name: 'Telefónica',
        shares: 100,
        price: 4.0,
        type: STOCK_TYPE.Buy,
        date: new Date(1000),
        platform: 'DEGIRO'
      })

      stocksRepository.create({
        user: username,
        ticker: 'ITX.MC',
        name: 'Inditex',
        shares: 10,
        price: 50.0,
        type: STOCK_TYPE.Buy,
        date: new Date(500), // Should be first
        platform: 'DEGIRO'
      })

      const stocks = stocksRepository.findAllByUser(username)
      expect(stocks).toHaveLength(2)
      expect(stocks[0].ticker).toBe('ITX.MC')
      expect(stocks[1].ticker).toBe('TEF.MC')
    })
  })

  describe('delete', () => {
    it('deletes a stock by id and user', () => {
      const stock = stocksRepository.create({
        user: username,
        ticker: 'TEF.MC',
        name: 'Telefónica',
        shares: 100,
        price: 4.0,
        type: STOCK_TYPE.Buy,
        date: new Date(1000),
        platform: 'DEGIRO'
      })

      stocksRepository.delete(stock.id, username)

      const stocks = stocksRepository.findAllByUser(username)
      expect(stocks).toHaveLength(0)
    })

    it('does not delete if user does not match', () => {
      const stock = stocksRepository.create({
        user: username,
        ticker: 'TEF.MC',
        name: 'Telefónica',
        shares: 100,
        price: 4.0,
        type: STOCK_TYPE.Buy,
        date: new Date(1000),
        platform: 'DEGIRO'
      })

      stocksRepository.delete(stock.id, 'anotheruser')

      const stocks = stocksRepository.findAllByUser(username)
      expect(stocks).toHaveLength(1)
    })
  })
})
