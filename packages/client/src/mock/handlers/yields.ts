import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

const YIELD_TYPES = ['interest', 'cashback']
const YIELD_NAMES = ['Intereses Cuenta Naranja', 'Cashback recibos luz', 'Intereses MyInvestor']

const makeYield = (index: number = 0) => ({
  _id: faker.database.mongodbObjectId(),
  name: YIELD_NAMES[index % YIELD_NAMES.length],
  type: YIELD_TYPES[index % YIELD_TYPES.length],
  account: {
    _id: faker.database.mongodbObjectId(),
    name: faker.finance.accountName(),
    bank: faker.company.name()
  },
  netAccumulated: faker.number.float({ min: 0, max: 50, multipleOf: 0.01 }),
  entriesCount: faker.number.int({ min: 0, max: 5 }),
  paymentsCount: faker.number.int({ min: 0, max: 3 })
})

export const YIELDS_LIST = Array.from({ length: 3 }, (_, i) => makeYield(i))

export const yieldsHandlers = [
  http.get('/yields', () => {
    return HttpResponse.json(YIELDS_LIST)
  }),

  http.post('/yields', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({ ...makeYield(), ...body }, { status: 200 })
  }),

  http.put('/yields/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, any>
    const found = YIELDS_LIST.find(y => y._id === params.id) ?? YIELDS_LIST[0]
    return HttpResponse.json({ ...found, ...body })
  }),

  http.delete('/yields/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/yields/:id', ({ params }) => {
    const found = YIELDS_LIST.find(y => y._id === params.id) ?? YIELDS_LIST[0]
    return HttpResponse.json({ ...found, entries: [] })
  }),

  http.get('/yields/:id/matching-transactions', () => {
    return HttpResponse.json([])
  }),

  http.post('/yields/:id/link-transactions', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/yields/:id/unlink-transactions/:transactionId', () => {
    return new HttpResponse(null, { status: 204 })
  })
]
