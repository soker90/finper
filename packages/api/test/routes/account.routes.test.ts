import supertest from 'supertest'
import {
  mongoose,
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'

const testDatabase = require('../test-db')(mongoose)

describe('Account', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /create', () => {
    const path = '/api/account/create'
    let token: string

    beforeEach(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`).expect(422)
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
})
