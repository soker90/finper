import { faker } from '@faker-js/faker'
import { MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from '../src/config/inputs'
import supertest from 'supertest'
import { insertCredentials } from './insert-data-to-model'

const defaultCredentials = {
  username: faker.internet.userName().slice(0, MAX_USERNAME_LENGTH).toLowerCase(),
  password: faker.internet.password({ length: MIN_PASSWORD_LENGTH - 1 })
}

type CredentialsTYpe = {
  username: string
  password?: string
}

const defaultApp = require('../src/server').app

export const requestLogin = (app = defaultApp, credentials: CredentialsTYpe = defaultCredentials): Promise<string> => {
  if (!credentials.password) {
    credentials.password = defaultCredentials.password
  }

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
