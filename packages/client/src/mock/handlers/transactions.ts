import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

const TRANSACTIONS_LIST = Array.from({ length: 5 }, () => ({
  _id: faker.database.mongodbObjectId(),
  date: faker.date.recent({ days: 30 }).getTime(),
  category: {
    _id: faker.database.mongodbObjectId(),
    name: faker.commerce.department()
  },
  amount: faker.number.float({ min: 5, max: 500, multipleOf: 0.01 }),
  type: faker.helpers.arrayElement(['expense', 'income'] as const),
  account: {
    _id: faker.database.mongodbObjectId(),
    name: faker.finance.accountName(),
    bank: faker.company.name()
  },
  note: faker.lorem.sentence()
}))

export const transactionsHandlers = [
  http.get('/transactions', () => {
    return HttpResponse.json(TRANSACTIONS_LIST)
  }),
  http.post('/transactions', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ _id: faker.database.mongodbObjectId(), ...body })
  }),
  http.put('/transactions/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ _id: params.id, ...body })
  }),
  http.delete('/transactions/:id', () => HttpResponse.json(null, { status: 204 }))
]
