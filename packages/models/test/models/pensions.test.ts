import {
  mongoose, IPension, PensionModel
} from '../../src'
import createPension from '../helpers/create-pension'

const testDatabase = require('../test-db')(mongoose)

const testBudget = (expected: IPension, received: IPension) => {
  expect(expected.date).toBe(received.date)
  expect(expected.employeeAmount).toBe(received.employeeAmount)
  expect(expected.employeeUnits).toBe(received.employeeUnits)
  expect(expected.companyAmount).toBe(received.companyAmount)
  expect(expected.companyUnits).toBe(received.companyUnits)
  expect(expected.value).toBe(received.value)
  expect(expected.user).toBe(received.user)
}

describe('Pensions', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new budget', () => {
    let pensionData: IPension

    beforeAll(() => createPension().then((pension) => {
      pensionData = pension
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const pensionDocument: IPension = await PensionModel.findOne() as IPension

      testBudget(pensionDocument, pensionData)
    })
  })

  describe('when there are multiple pension transactions', () => {
    let firstPension: IPension

    beforeAll(async () => {
      firstPension = await createPension()

      await Promise.all([
        createPension(),
        createPension()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 pension transactions stored', async () => {
      const pensionsCounter = await PensionModel.countDocuments()
      expect(pensionsCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first pension transaction', async () => {
      const pensionDocument: IPension = await PensionModel.findOne({ _id: firstPension._id }) as IPension

      testBudget(pensionDocument, firstPension)
    })
  })
})
