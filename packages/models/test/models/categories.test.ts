import {
  CategoryModel, ICategory,
  mongoose
} from '../../src'
import createCategory from '../helpers/create-category'
import testDb from '../test-db'

const testDatabase = testDb(mongoose)

const testCategory = (expected: ICategory, received: ICategory) => {
  expect(expected.type).toBe(received.type)
  expect(expected.name).toBe(received.name)
  expect(expected.parent?.toString()).toBe(received.parent?.toString())
}

describe('Category', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new category', () => {
    let categoryData: ICategory

    beforeAll(async () => {
      const parent = await createCategory()
      categoryData = await createCategory({ parent: parent._id })
    })

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties with parent category', async () => {
      const categoryDocument: ICategory = await CategoryModel.findOne({ _id: categoryData._id })

      testCategory(categoryDocument, categoryData)
    })
  })

  describe('when there are multiple accounts', () => {
    let firstCategory: ICategory

    beforeAll(async () => {
      firstCategory = await createCategory()

      await Promise.all([
        createCategory(),
        createCategory()
      ])
    })

    test('it should be 3 account stored', async () => {
      const categoryCounter = await CategoryModel.count({ name: { $ne: 'root' } })
      expect(categoryCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first category', async () => {
      const categoryDocument: ICategory = await CategoryModel.findOne({ _id: firstCategory._id })

      testCategory(categoryDocument, firstCategory)
    })
  })
})
