import {
  StoreModel, IStore,
  mongoose
} from '../../src'
import createStore from '../helpers/create-store'
import { faker } from '@faker-js/faker'

const testDatabase = require('../test-db')(mongoose)

const testDebt = (expected: IStore, received: IStore) => {
  expect(expected.name).toBe(received.name)
  expect(expected.user).toBe(received.user)
}

describe('Store', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new debt', () => {
    let storeData: IStore

    beforeAll(() => createStore().then((store) => {
      storeData = store
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const storeDocument: IStore = await StoreModel.findOne() as IStore

      testDebt(storeDocument, storeData)
    })
  })

  describe('when there are multiple accounts', () => {
    let firstStore: IStore

    beforeAll(async () => {
      firstStore = await createStore()

      await Promise.all([
        createStore(),
        createStore()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 account stored', async () => {
      const storeCounter = await StoreModel.count()
      expect(storeCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first category', async () => {
      const storeDocument: IStore = await StoreModel.findOne({ _id: firstStore._id }) as IStore

      testDebt(storeDocument, firstStore)
    })
  })

  describe('when not match case sensitive', () => {
    let store: IStore

    beforeAll(async () => {
      store = await createStore({ name: faker.company.companyName().toUpperCase() })
    })

    test('it should find the store', async () => {
      const storeDocument: IStore = await StoreModel.findOne({ name: store.name.toLowerCase() }) as IStore

      testDebt(storeDocument, store)
    })
  })
})
