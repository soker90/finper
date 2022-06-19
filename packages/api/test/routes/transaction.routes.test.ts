import supertest from 'supertest'
import {
  mongoose, StoreModel, TransactionType
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertAccount, insertCategory, insertTransaction } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Transaction', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /', () => {
    const path = '/api/transactions'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).expect(422)
    })

    test.each(['date', 'category', 'amount', 'type', 'account'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, string | number> = {
        date: faker.date.past().getTime(),
        category: (await insertCategory())._id.toString(),
        amount: faker.finance.amount(),
        type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
        account: (await insertAccount())._id.toString()
      }

      delete params[param]
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when the account is of other user, it should response an error with status code 404', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: faker.date.past().getTime(),
          category: (await insertCategory())._id.toString(),
          amount: faker.finance.amount(),
          type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
          account: (await insertAccount())._id.toString(),
          note: faker.lorem.sentence(),
          store: faker.company.companyName()
        })
        .expect(404)
    })

    test('when success creating an transaction', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: faker.date.past().getTime(),
          category: (await insertCategory())._id.toString(),
          amount: faker.finance.amount(),
          type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
          account: (await insertAccount({ user }))._id.toString(),
          note: faker.lorem.sentence(),
          store: faker.company.companyName()
        })
        .expect(200)
    })

    test('when success creating an transaction with same store, it should was create only one store', async () => {
      const store = faker.company.companyName()
      for (let i = 0; i < 2; i++) {
        await supertest(server.app)
          .post(path)
          .set('Authorization', `Bearer ${token}`)
          .send({
            date: faker.date.past().getTime(),
            category: (await insertCategory())._id.toString(),
            amount: faker.finance.amount(),
            type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
            account: (await insertAccount({ user }))._id.toString(),
            note: faker.lorem.sentence(),
            store
          })
          .expect(200)
      }

      expect(await StoreModel.count({ name: store })).toBe(1)
    })
  })
})
