import {
  LoanHistoryModel, ILoanHistory,
  mongoose
} from '../../src'
import createLoanHistory from '../helpers/create-loan-history'

const testDatabase = require('../test-db')(mongoose)

const testDebt = (expected: ILoanHistory, received: ILoanHistory) => {
  expect(expected.date).toBe(received.date)
  expect(expected.amount).toBe(received.amount)
  expect(expected.accumulated).toBe(received.accumulated)
  expect(expected.amortization).toBe(received.amortization)
  expect(expected.interests).toBe(received.interests)
  expect(expected.pending).toBe(received.pending)
  expect(expected.type).toBe(received.type)
  expect(expected.user).toBe(received.user)
}

describe('LoanHistory', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new loan history', () => {
    let loanData: ILoanHistory

    beforeAll(() => createLoanHistory().then((loan) => {
      loanData = loan
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const debtDocument: ILoanHistory = await LoanHistoryModel.findOne() as ILoanHistory

      testDebt(debtDocument, loanData)
    })
  })

  describe('when there are multiple loans', () => {
    let firstLoan: ILoanHistory

    beforeAll(async () => {
      firstLoan = await createLoanHistory()

      await Promise.all([
        createLoanHistory(),
        createLoanHistory()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 loans stored', async () => {
      const loanCounter = await LoanHistoryModel.count()
      expect(loanCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first loan', async () => {
      const loanDocument: ILoanHistory = await LoanHistoryModel.findOne({ _id: firstLoan._id }) as ILoanHistory

      testDebt(loanDocument, firstLoan)
    })
  })
})
