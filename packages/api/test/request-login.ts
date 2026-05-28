import { faker } from '@faker-js/faker'
import { MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from '../src/config/inputs'
import supertest from 'supertest'
import { insertCredentials } from './insert-data-to-model'

const generateDefaultCredentials = (): CredentialsTYpe => ({
  username: faker.internet.username().slice(0, MAX_USERNAME_LENGTH).toLowerCase(),
  password: faker.internet.password({ length: MIN_PASSWORD_LENGTH - 1 })
})

type CredentialsTYpe = {
  username: string
  password?: string
}

const defaultApp = require('../src/server').app

export const requestLogin = (app = defaultApp, credentials?: CredentialsTYpe): Promise<string> => {
  const creds = credentials ?? generateDefaultCredentials()
  if (!creds.password) {
    creds.password = generateDefaultCredentials().password
  }

  return insertCredentials(creds).then(() => (
    supertest(app)
      .post('/api/auth/login')
      .send({
        username: creds.username,
        password: creds.password
      })
      .then(res => res.body.token)))
    .catch(/* istanbul ignore next */(err: unknown) => {
      console.error(err)
      throw err
    })
}
