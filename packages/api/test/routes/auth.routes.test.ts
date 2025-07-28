import supertest from 'supertest'
import {
  mongoose,
  UserModel
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'
import { insertCredentials } from '../insert-data-to-model'
import { MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from '../../src/config/inputs'
import { requestLogin } from '../request-login'

const testDatabase = require('../test-db')(mongoose)

function getUsername (): string {
  return faker.internet.userName().slice(0, MAX_USERNAME_LENGTH)
}

describe('Auth', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /register', () => {
    const path = '/api/auth/register'

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).send({}).expect(422)
    })

    test('when no username param provided, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          password: faker.internet.password({ length: MIN_PASSWORD_LENGTH })
        })
        .expect(422)
    })

    test('when username\'s length is less than 3 characters, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          username: 't',
          password: faker.internet.password({ length: MIN_PASSWORD_LENGTH })
        })
        .expect(422)
    })

    test('when username\'s length is more than 15 characters, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          username: 'aaaaaaaaaaaaaaaa',
          password: faker.internet.password({ length: MIN_PASSWORD_LENGTH })
        })
        .expect(422)
    })

    test('when no password param provided, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          username: faker.internet.userName()
        })
        .expect(422)
    })

    test('when password\'s length is less than 5 characters, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          username: faker.internet.userName(),
          password: faker.internet.password({ length: MIN_PASSWORD_LENGTH - 1 })
        })
        .expect(422)
    })

    describe('when trying to create another account with an existing username', () => {
      let response: supertest.Response

      const username = faker.internet.userName().slice(0, MAX_USERNAME_LENGTH)

      beforeAll(async () => {
        await insertCredentials({ username, password: faker.internet.password({ length: MIN_PASSWORD_LENGTH - 1 }) })

        response = await supertest(server.app)
          .post(path)
          .send({
            username,
            password: faker.internet.password({ length: MIN_PASSWORD_LENGTH })
          })
      })

      afterAll(() => UserModel.deleteMany({}))

      test('it should response an error of 409', () => {
        expect(response.statusCode).toBe(409)
      })
    })

    describe('when success creating an account', () => {
      let response: supertest.Response

      beforeAll(async () => {
        await insertCredentials()

        response = await supertest(server.app)
          .post(path)
          .send({
            username: getUsername(),
            password: faker.internet.password({ length: MIN_PASSWORD_LENGTH })
          })
      })

      afterAll(() => Promise.all([
        UserModel.deleteMany()
      ]))

      test('it should response an status code of 200', () => {
        expect(response.statusCode).toBe(200)
      })

      test('it should response with the jwt token', () => {
        expect(response.body.token).toBeDefined()
      })

      test('it should be stored 2 documents', async () => {
        const documentCounter = await UserModel.countDocuments()
        expect(documentCounter).toBe(2)
      })
    })
  })

  describe('POST /login', () => {
    const path = '/api/auth/login'

    test('when no params provided, it should response with a status code of 422', async () => {
      await supertest(server.app).post(path).send({}).expect(422)
    })

    test('when no user param provided, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({ password: faker.internet.password({ length: MIN_PASSWORD_LENGTH }) })
        .expect(422)
    })

    test('when no password param provided, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({ username: faker.internet.userName() })
        .expect(422)
    })

    describe('when trying to login but username doesn\'t exist', () => {
      let response: supertest.Response

      beforeAll(async () => {
        await insertCredentials()

        response = await supertest(server.app)
          .post(path)
          .send({
            username: faker.internet.userName(),
            password: faker.internet.password({ length: MIN_PASSWORD_LENGTH })
          })
      })

      afterAll(() => UserModel.deleteMany())

      test('it should response a status code of 401', () => {
        expect(response.statusCode).toBe(401)
      })
    })

    describe('when password is not the same', () => {
      let response: supertest.Response

      const username = getUsername()
      const password = faker.internet.password({ length: MIN_PASSWORD_LENGTH })

      beforeAll(async () => {
        await insertCredentials({ username })
        response = await supertest(server.app).post(path).send({ username, password })
      })

      afterAll(() => UserModel.deleteMany())

      test('it should response an error code of 401', () => {
        expect(response.statusCode).toBe(401)
      })
    })

    describe('when login with username and password success', () => {
      let response: supertest.Response

      const username = getUsername()
      const password = faker.internet.password({ length: MIN_PASSWORD_LENGTH })

      beforeAll(async () => {
        await insertCredentials({
          username,
          password
        })

        response = await supertest(server.app).post(path).send({ username, password })
      })

      afterAll(() => UserModel.deleteMany())

      test('it should response a status code of 200', () => {
        expect(response.statusCode).toBe(200)
      })
    })
  })

  describe('GET /me', () => {
    const path = '/api/auth/me'

    test('when no token provided, it should response with a status code of 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when token is not valid, it should response with a status code of 401', async () => {
      await supertest(server.app).get(path).set('Authorization', 'notValid').expect(401)
    })

    test('when token is expired, it should response with a status code of 401', async () => {
      await supertest(server.app)
        .get(path)
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImVkdSIsImlhdCI6MTY1NDUzNjE1MCwiZXhwIjoxNjU0NTM2MTUwfQ.Vo9EJmvVxLmeal8wtRbTT7Vg0Z7A8QoIUO4GwuS4uJ8')
        .expect(401)
    })

    describe('when token is valid', () => {
      let token: string

      beforeAll(async () => {
        await insertCredentials()

        token = await requestLogin(server.app)
      })

      afterAll(() => UserModel.deleteMany())

      test('it should response a status code of 204', async () => {
        await supertest(server.app).get(path).set('Authorization', `Bearer ${token}`).expect(204)
      })
    })
  })
})
