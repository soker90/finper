import { faker } from '@faker-js/faker'
import { MIN_PASSWORD_LENGTH } from '../src/config/inputs'
import supertest from 'supertest'
import { insertCredentials } from './insert-data-to-model'

const defaultCredentials = {
  username: faker.internet.userName(),
  password: faker.internet.password(MIN_PASSWORD_LENGTH - 1)
}

const defaultApp = require('../src/server').app

export const requestLogin = (app = defaultApp, credentials = defaultCredentials): Promise<string> => {
  return insertCredentials(credentials).then(() => (
    supertest(app)
      .post('/api/auth/login')
      .send({
        username: credentials.username,
        password: credentials.password
      })
      .then(res => res.body.token)))
    .catch(err => {
      console.error(err)
      throw err
    })
}
