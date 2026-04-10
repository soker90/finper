import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { SUBSCRIPTION_CYCLE } from 'types'

const CYCLES = Object.values(SUBSCRIPTION_CYCLE)

const makeSubscription = () => ({
  _id: faker.database.mongodbObjectId(),
  name: faker.helpers.arrayElement(['Netflix', 'Spotify', 'Amazon Prime', 'HBO Max', 'Disney+', 'YouTube Premium', 'Apple TV+', 'Gym']),
  amount: faker.number.float({ min: 4, max: 30, multipleOf: 0.01 }),
  cycle: faker.helpers.arrayElement(CYCLES),
  nextPaymentDate: faker.date.soon({ days: 30 }).getTime(),
  categoryId: {
    _id: faker.database.mongodbObjectId(),
    name: 'Ocio'
  },
  accountId: {
    _id: faker.database.mongodbObjectId(),
    name: faker.finance.accountName(),
    bank: faker.company.name()
  },
  logoUrl: ''
})

const makeCandidate = () => ({
  _id: faker.database.mongodbObjectId(),
  transactionId: {
    _id: faker.database.mongodbObjectId(),
    date: faker.date.recent({ days: 7 }).getTime(),
    amount: faker.number.float({ min: 5, max: 20, multipleOf: 0.01 }),
    category: { _id: faker.database.mongodbObjectId(), name: 'Ocio' },
    account: { _id: faker.database.mongodbObjectId(), name: faker.finance.accountName(), bank: faker.company.name() },
    note: faker.lorem.words(3)
  },
  subscriptionIds: [makeSubscription()],
  createdAt: faker.date.recent({ days: 3 }).toISOString()
})

export const SUBSCRIPTIONS_LIST = Array.from({ length: 3 }, makeSubscription)
export const CANDIDATES_LIST = Array.from({ length: 1 }, makeCandidate)

export const subscriptionsHandlers = [
  http.get('/subscriptions', () => {
    return HttpResponse.json(SUBSCRIPTIONS_LIST)
  }),

  http.post('/subscriptions', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({ ...makeSubscription(), ...body }, { status: 200 })
  }),

  http.put('/subscriptions/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, any>
    const found = SUBSCRIPTIONS_LIST.find(s => s._id === params.id) ?? SUBSCRIPTIONS_LIST[0]
    return HttpResponse.json({ ...found, ...body })
  }),

  http.delete('/subscriptions/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/subscriptions/:id/transactions', () => {
    return HttpResponse.json([])
  }),

  http.get('/subscriptions/:id/matching-transactions', () => {
    return HttpResponse.json([])
  }),

  http.post('/subscriptions/:id/link-transactions', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/subscriptions/candidates', () => {
    return HttpResponse.json(CANDIDATES_LIST)
  }),

  http.post('/subscriptions/candidates/:id/assign', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/subscriptions/candidates/:id/dismiss', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/subscriptions/:id/unlink-transactions/:transactionId', () => {
    return new HttpResponse(null, { status: 204 })
  })
]
