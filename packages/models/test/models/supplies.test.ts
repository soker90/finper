import { SupplyModel, SupplyDocument, mongoose } from '../../src'
import createSupply from '../helpers/create-supply'

const testDatabase = require('../test-db')(mongoose)

const testSupply = (expected: SupplyDocument, received: SupplyDocument) => {
  expect(expected.name).toBe(received.name)
  expect(expected.type).toBe(received.type)
  expect(expected.user).toBe(received.user)
  expect(expected.propertyId.toString()).toBe(received.propertyId.toString())
}

describe('Supply', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new supply', () => {
    let supplyData: SupplyDocument

    beforeAll(() => createSupply().then((supply) => {
      supplyData = supply
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const supplyDocument: SupplyDocument = await SupplyModel.findOne()

      testSupply(supplyDocument, supplyData)
    })
  })
})
