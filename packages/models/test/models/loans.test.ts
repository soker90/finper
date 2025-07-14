import {
  LoanModel, ILoan,
  mongoose
} from '../../src'
import createLoan from '../helpers/create-loan'

const testDatabase = require('../test-db')(mongoose)

const testDebt = (expected: ILoan, received: ILoan) => {
  expect(expected.date).toBe(received.date)
  expect(expected.name).toBe(received.name)
  expect(expected.interest).toBe(received.interest)
  expect(expected.user).toBe(received.user)
  expected.saving.forEach((saving, index) => {
    expect(saving.cost).toBe(received.saving[index].cost)
    expect(saving.date).toBe(received.saving[index].date)
    expect(saving.saving).toBe(received.saving[index].saving)
    expect(saving.accumulated).toBe(received.saving[index].accumulated)
    expect(saving.pending).toBe(received.saving[index].pending)
    expect(saving.finishDate).toBe(received.saving[index].finishDate)
  })
}

describe('Loan', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new loan', () => {
    let loanData: ILoan

    beforeAll(() => createLoan().then((loan) => {
      loanData = loan
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const debtDocument: ILoan = await LoanModel.findOne() as ILoan

      testDebt(debtDocument, loanData)
    })
  })

  describe('when there are multiple loans', () => {
    let firstLoan: ILoan

    beforeAll(async () => {
      firstLoan = await createLoan()

      await Promise.all([
        createLoan(),
        createLoan()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 loans stored', async () => {
      const loanCounter = await LoanModel.count()
      expect(loanCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first loan', async () => {
      const loanDocument: ILoan = await LoanModel.findOne({ _id: firstLoan._id }) as ILoan

      testDebt(loanDocument, firstLoan)
    })
  })
})
