import { faker } from '@faker-js/faker'
import { compare } from 'bcrypt'
import {
  UserModel,
  mongoose
} from '../../src'
import createUser from '../helpers/create-user'
import { UserDocument } from '../../src/models/users'

const testDatabase = require('../test-db')(mongoose)

describe('Users', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('when there is a new user', () => {
    const accountData = {
      username: faker.internet.username(),
      password: faker.internet.password()
    }

    beforeAll(() => UserModel.create(accountData))

    afterAll(() => testDatabase.clear())

    test('it should contain all the defined properties', async () => {
      const accountDocument: UserDocument = await UserModel.findOne()
      const isSamePassword: boolean = await compare(accountData.password, accountDocument.password)

      expect(accountDocument.username).toBe(accountData.username)
      expect(isSamePassword).toBeTruthy()
    })
  })

  describe('when there are multiple accounts', () => {
    let firstAccount: UserDocument

    beforeAll(async () => {
      firstAccount = await createUser()

      await Promise.all([
        createUser(),
        createUser()
      ])
    })

    afterAll(() => testDatabase.clear())

    test('it should be 3 account stored', async () => {
      const accountCounter = await UserModel.countDocuments()
      expect(accountCounter).toBe(3)
    })

    test('it should contain all the defined properties of the first account', async () => {
      const accountDocument: UserDocument = await UserModel.findOne({ _id: firstAccount._id })

      expect(accountDocument.username).toBe(firstAccount.username)
      expect(accountDocument.password).toBe(firstAccount.password)
    })
  })
})
