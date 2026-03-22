import {
  StoreModel, StoreDocument,
  mongoose
} from '../../src'
import createStore from '../helpers/create-store'
import { faker } from '@faker-js/faker'

const testDatabase = require('../test-db')(mongoose)

const testDebt = (expected: StoreDocument, received: StoreDocument) => {
  expect(expected.name).toBe(received.name)
  expect(expected.user).toBe(received.user)
}

describe('Store', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new debt', () => {
    let storeData: StoreDocument

    beforeAll(() => createStore().then((store) => {
      storeData = store
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const storeDocument: StoreDocument = await StoreModel.findOne()

      testDebt(storeDocument, storeData)
    })
  })

  describe('when there are multiple accounts', () => {
    let firstStore: StoreDocument

    beforeAll(async () => {
      firstStore = await createStore()

      await Promise.all([
        createStore(),
        createStore()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 account stored', async () => {
      const storeCounter = await StoreModel.countDocuments()
      expect(storeCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first category', async () => {
      const storeDocument: StoreDocument = await StoreModel.findOne({ _id: firstStore._id })

      testDebt(storeDocument, firstStore)
    })
  })

  describe('when not match case sensitive', () => {
    let store: StoreDocument

    beforeAll(async () => {
      store = await createStore({ name: faker.company.name().toUpperCase() })
    })

    test('it should find the store', async () => {
      const storeDocument: StoreDocument = await StoreModel.findOne({ name: store.name.toLowerCase() })

      testDebt(storeDocument, store)
    })
  })
})
