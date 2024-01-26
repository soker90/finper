import {
  DebtModel, IDebt,
  mongoose
} from '../../src'
import createDebt from '../helpers/create-debt'

const testDatabase = require('../test-db')(mongoose)

const testDebt = (expected: IDebt, received: IDebt) => {
  expect(expected.from).toBe(received.from)
  expect(expected.date).toBe(received.date)
  expect(expected.amount).toBe(received.amount)
  expect(expected.paymentDate).toBe(received.paymentDate)
  expect(expected.concept).toBe(received.concept)
  expect(expected.type).toBe(received.type)
  expect(expected.user).toBe(received.user)
}

describe('Debt', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new debt', () => {
    let debtData: IDebt

    beforeAll(() => createDebt().then((debt) => {
      debtData = debt
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const debtDocument: IDebt = await DebtModel.findOne() as IDebt

      testDebt(debtDocument, debtData)
    })
  })

  describe('when there are multiple accounts', () => {
    let firstDebt: IDebt

    beforeAll(async () => {
      firstDebt = await createDebt()

      await Promise.all([
        createDebt(),
        createDebt()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 account stored', async () => {
      const debtCounter = await DebtModel.countDocuments()
      expect(debtCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first category', async () => {
      const debtDocument: IDebt = await DebtModel.findOne({ _id: firstDebt._id }) as IDebt

      testDebt(debtDocument, firstDebt)
    })
  })
})
