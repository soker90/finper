import { PropertyModel, PropertyDocument, mongoose } from '../../src'
import createProperty from '../helpers/create-property'

const testDatabase = require('../test-db')(mongoose)

const testProperty = (expected: PropertyDocument, received: PropertyDocument) => {
  expect(expected.name).toBe(received.name)
  expect(expected.user).toBe(received.user)
}

describe('Property', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new property', () => {
    let propertyData: PropertyDocument

    beforeAll(() => createProperty().then((property) => {
      propertyData = property
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const propertyDocument: PropertyDocument = await PropertyModel.findOne()

      testProperty(propertyDocument, propertyData)
    })
  })

  describe('when there are multiple properties', () => {
    let firstProperty: PropertyDocument

    beforeAll(async () => {
      firstProperty = await createProperty()

      await Promise.all([
        createProperty(),
        createProperty()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 properties stored', async () => {
      const propertyCounter = await PropertyModel.countDocuments()
      expect(propertyCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first property', async () => {
      const propertyDocument: PropertyDocument = await PropertyModel.findOne({ _id: firstProperty._id })

      testProperty(propertyDocument, firstProperty)
    })
  })
})
