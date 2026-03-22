import supertest from 'supertest'
import { mongoose } from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'

const testDatabase = require('../test-db')(mongoose)

const mockFetch = (ok: boolean, body: object = {}) =>
  jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    text: async () => 'error',
    json: async () => body
  } as Response)

describe('Ticket', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())
  afterEach(() => jest.restoreAllMocks())

  describe('GET /', () => {
    const path = '/api/tickets'
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when bot responds ok, it should return the tickets with status code 200', async () => {
      const tickets = [
        {
          id: faker.string.uuid(),
          store: faker.company.name(),
          amount: faker.number.float(),
          status: 'pending',
          payment_method: faker.finance.transactionType(),
          raw_text: null,
          image_url: null,
          date: null,
          telegram_message_id: faker.number.int(),
          telegram_chat_id: faker.number.int(),
          created_at: Date.now(),
          reviewed_at: null
        }
      ]
      mockFetch(true, { tickets })

      await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(200, { tickets, total: tickets.length })
    })

    test('when bot responds with an error, it should response with status code 500', async () => {
      mockFetch(false)

      await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(500)
    })
  })

  describe('PATCH /:id', () => {
    const path = (id: string) => `/api/tickets/${id}`
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).patch(path('any')).expect(401)
    })

    test('when bot responds ok, it should response with status code 200', async () => {
      const id = faker.string.uuid()
      mockFetch(true)

      await supertest(server.app)
        .patch(path(id))
        .auth(token, { type: 'bearer' })
        .expect(200, { success: true, id })
    })

    test('when bot responds with an error, it should response with status code 500', async () => {
      mockFetch(false)

      await supertest(server.app)
        .patch(path(faker.string.uuid()))
        .auth(token, { type: 'bearer' })
        .expect(500)
    })
  })

  describe('DELETE /:id', () => {
    const path = (id: string) => `/api/tickets/${id}`
    let token: string

    beforeAll(async () => {
      token = await requestLogin(server.app)
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).delete(path('any')).expect(401)
    })

    test('when bot responds ok, it should response with status code 204', async () => {
      mockFetch(true)

      await supertest(server.app)
        .delete(path(faker.string.uuid()))
        .auth(token, { type: 'bearer' })
        .expect(204)
    })

    test('when bot responds with an error, it should response with status code 500', async () => {
      mockFetch(false)

      await supertest(server.app)
        .delete(path(faker.string.uuid()))
        .auth(token, { type: 'bearer' })
        .expect(500)
    })
  })
})
