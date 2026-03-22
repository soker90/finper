import {
  AccountModel, AccountDocument,
  mongoose
} from '../../src'
import createAccount from '../helpers/create-account'
import { faker } from '@faker-js/faker'

const testDatabase = require('../test-db')(mongoose)

describe('Account', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new account', () => {
    let accountData: AccountDocument

    beforeAll(() => createAccount().then((account) => {
      accountData = account
    }))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const accountDocument: AccountDocument = await AccountModel.findOne()

      expect(accountDocument.name).toBe(accountData.name)
      expect(accountDocument.bank).toBe(accountData.bank)
      expect(accountDocument.balance).toBe(accountData.balance)
      expect(accountDocument.isActive).toBe(accountData.isActive)
      expect(accountDocument.user).toBe(accountData.user)
    })
  })

  describe('when there are multiple accounts', () => {
    let firstAccount: AccountDocument

    beforeAll(async () => {
      firstAccount = await createAccount()

      await Promise.all([
        createAccount(),
        createAccount()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 account stored', async () => {
      const accountCounter = await AccountModel.countDocuments()
      expect(accountCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first account', async () => {
      const accountDocument: AccountDocument = await AccountModel.findOne({ _id: firstAccount._id })

      expect(accountDocument.name).toBe(firstAccount.name)
      expect(accountDocument.bank).toBe(firstAccount.bank)
      expect(accountDocument.balance).toBe(firstAccount.balance)
      expect(accountDocument.isActive).toBe(firstAccount.isActive)
      expect(accountDocument.user).toBe(firstAccount.user)
    })
  })

  test('it should save balance with 2 decimal places', async () => {
    const account = await createAccount({ balance: faker.number.float({ multipleOf: 0.001 }) })
    const accountDocument: AccountDocument = await AccountModel.findOne({ _id: account._id })

    expect(accountDocument.balance).toBe(account.balance)
  })
})
