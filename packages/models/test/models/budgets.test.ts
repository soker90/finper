import {
  mongoose, IBudget, BudgetModel
} from '../../src'
import createBudget from '../helpers/create-budget'

const testDatabase = require('../test-db')(mongoose)

const testBudget = (expected: IBudget, received: IBudget) => {
  expect(expected.year).toBe(received.year)
  expect(expected.month).toBe(received.month)
  expect(expected.category.toString()).toBe(received.category.toString())
  expect(expected.amount).toBe(received.amount)
  expect(expected.user).toBe(received.user)
}

describe('Budgets', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new budget', () => {
    let budgetData: IBudget

    beforeAll(() => createBudget().then((budget) => {
      budgetData = budget
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const budgetDocument: IBudget = await BudgetModel.findOne() as IBudget

      testBudget(budgetDocument, budgetData)
    })
  })

  describe('when there are multiple transactions', () => {
    let firstBudget: IBudget

    beforeAll(async () => {
      firstBudget = await createBudget()

      await Promise.all([
        createBudget(),
        createBudget()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 transactions stored', async () => {
      const budgetsCounter = await BudgetModel.count()
      expect(budgetsCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first category', async () => {
      const budgetDocument: IBudget = await BudgetModel.findOne({ _id: firstBudget._id }) as IBudget

      testBudget(budgetDocument, firstBudget)
    })
  })
})
