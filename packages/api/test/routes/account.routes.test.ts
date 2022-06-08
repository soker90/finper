import supertest from 'supertest'
import {
  mongoose
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertAccount } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Account', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /', () => {
    const path = '/api/accounts'
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).expect(422)
    })

    test.each(['name', 'bank'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, string> = {
        name: faker.finance.accountName(),
        bank: faker.lorem.word()
      }

      delete params[param]
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when success creating an account', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: faker.finance.accountName(),
          bank: faker.lorem.word()
        })
        .expect(200)
    })
  })

  describe('GET /', () => {
    const path = '/api/accounts'
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      await insertAccount({ isActive: true })
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when then user have no accounts, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when the user have no accounts active, it should return an empty array', async () => {
      await insertAccount({ isActive: false, user })
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when the user have accounts, it should return the accounts', async () => {
      const account = await insertAccount({
        isActive: true,
        user
      })
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [{
        _id: account._id.toString(),
        name: account.name,
        bank: account.bank,
        balance: account.balance
      }])
    })
  })
})
