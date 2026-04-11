import { SupplyReadingModel, SupplyReadingDocument, mongoose } from '../../src'
import createSupplyReading from '../helpers/create-supply-reading'

const testDatabase = require('../test-db')(mongoose)

const testSupplyReading = (expected: SupplyReadingDocument, received: SupplyReadingDocument) => {
  expect(expected.supplyId.toString()).toBe(received.supplyId.toString())
  expect(expected.startDate).toBe(received.startDate)
  expect(expected.endDate).toBe(received.endDate)
  expect(expected.user).toBe(received.user)
}

describe('SupplyReading', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new supply reading', () => {
    let readingData: SupplyReadingDocument

    beforeAll(() => createSupplyReading().then((reading) => {
      readingData = reading
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const readingDocument = await SupplyReadingModel.findOne() as SupplyReadingDocument

      testSupplyReading(readingDocument, readingData)
    })
  })
})
