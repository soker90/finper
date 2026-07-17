import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

const YIELD_TYPES = ['interest', 'cashback']

const makeYield = (index: number = 0) => {
  const accountId = faker.database.mongodbObjectId()
  const categoryIds = [faker.database.mongodbObjectId()]
  const net = faker.number.float({ min: 10, max: 50, multipleOf: 0.01 })
  return {
    _id: faker.database.mongodbObjectId(),
    type: YIELD_TYPES[index % YIELD_TYPES.length] as any,
    accountId,
    categoryIds,
    account: {
      _id: accountId,
      name: faker.finance.accountName(),
      bank: faker.company.name()
    },
    netAccumulated: net,
    annualBreakdown: [
      { year: 2026, net: Number((net * 0.6).toFixed(2)), grossIncome: Number((net * 0.6).toFixed(2)), taxExpense: 0, billsTotal: 100, cashbackAmount: Number((net * 0.6).toFixed(2)), settlementsCount: 1, weightedTae: 2.5, percentage: 3.2 },
      { year: 2025, net: Number((net * 0.4).toFixed(2)), grossIncome: Number((net * 0.4).toFixed(2)), taxExpense: 0, billsTotal: 80, cashbackAmount: Number((net * 0.4).toFixed(2)), settlementsCount: 1, weightedTae: 2.0, percentage: 3.0 }
    ],
    entriesCount: faker.number.int({ min: 0, max: 5 }),
    paymentsCount: faker.number.int({ min: 0, max: 3 })
  }
}

export const YIELDS_LIST = Array.from({ length: 3 }, (_, i) => makeYield(i))

// Two settlements: one pending (settlementDate null) and one with income (settlementDate set)
const MOCK_DETAIL_SETTLEMENTS = [
  {
    id: 'settlement2',
    settlementDate: null,
    grossIncome: 60,
    taxExpense: 0,
    net: 60,
    tae: null,
    averageBalance: null,
    taeSource: null,
    balanceSource: null,
    billsTotal: 60,
    cashbackAmount: 0,
    percentage: null,
    status: 'pending',
    entries: []
  },
  {
    id: 'settlement1',
    settlementDate: new Date('2026-07-01').getTime(),
    grossIncome: 100,
    taxExpense: 0,
    net: 100,
    tae: 2.5,
    averageBalance: 48000,
    taeSource: 'provided',
    balanceSource: 'calculated',
    billsTotal: 0,
    cashbackAmount: 100,
    percentage: null,
    status: 'completed',
    entries: [
      {
        _id: 'tx1',
        date: new Date('2026-07-01').getTime(),
        amount: 100,
        type: 'income',
        category: { _id: 'cat1', name: 'Intereses' },
        note: 'Abono intereses'
      }
    ]
  }
]

export const yieldsHandlers = [
  http.get('/yields', () => {
    return HttpResponse.json(YIELDS_LIST)
  }),

  http.post('/yields', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    const base = makeYield()
    return HttpResponse.json({ ...base, ...body }, { status: 200 })
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
    return HttpResponse.json({
      ...found,
      entries: [
        {
          _id: 'tx1',
          date: new Date('2026-07-01').getTime(),
          amount: 100,
          type: 'income',
          category: { _id: 'cat1', name: 'Intereses' },
          note: 'Abono intereses'
        }
      ],
      settlements: MOCK_DETAIL_SETTLEMENTS
    })
  }),

  http.get('/yields/:id/matching-transactions', () => {
    return HttpResponse.json([])
  }),

  http.post('/yields/:id/link-transactions', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/yields/:id/settlements/:settlementId', () => {
    return HttpResponse.json({
      id: 'settlement1',
      tae: 3.0,
      averageBalance: 40000
    })
  }),

  http.delete('/yields/:id/unlink-transactions/:transactionId', () => {
    return new HttpResponse(null, { status: 204 })
  })
]
