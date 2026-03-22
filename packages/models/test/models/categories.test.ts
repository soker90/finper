import {
  CategoryModel, CategoryDocument,
  mongoose
} from '../../src'
import createCategory from '../helpers/create-category'
const testDatabase = require('../test-db')(mongoose)

const testCategory = (expected: CategoryDocument, received: CategoryDocument) => {
  expect(expected.type).toBe(received.type)
  expect(expected.name).toBe(received.name)
  expect(expected.parent?.toString()).toBe(received.parent?.toString())
  expect(expected.user).toBe(received.user)
}

describe('Category', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new category', () => {
    let categoryData: CategoryDocument

    beforeAll(async () => {
      const parent = await createCategory()
      categoryData = await createCategory({ parent: parent._id })
    })

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties with parent category', async () => {
      const categoryDocument: CategoryDocument = await CategoryModel.findOne({ _id: categoryData._id })

      testCategory(categoryDocument, categoryData)
    })
  })

  describe('when there are multiple accounts', () => {
    let firstCategory: CategoryDocument

    beforeAll(async () => {
      firstCategory = await createCategory()

      await Promise.all([
        createCategory(),
        createCategory()
      ])
    })

    test('it should be 3 account stored', async () => {
      const categoryCounter = await CategoryModel.countDocuments({ name: { $ne: 'root' } })
      expect(categoryCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first category', async () => {
      const categoryDocument: CategoryDocument = await CategoryModel.findOne({ _id: firstCategory._id })

      testCategory(categoryDocument, firstCategory)
    })
  })
})
