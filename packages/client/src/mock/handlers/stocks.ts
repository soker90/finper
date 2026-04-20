import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

const makePosition = (ticker: string, name: string) => {
  const totalCost = faker.number.float({ min: 500, max: 5000, multipleOf: 0.01 })
  const currentValue = faker.number.float({ min: 400, max: 6000, multipleOf: 0.01 })
  const gainLoss = parseFloat((currentValue - totalCost).toFixed(2))
  const shares = faker.number.float({ min: 10, max: 200, multipleOf: 0.01 })
  const avgCost = parseFloat((totalCost / shares).toFixed(2))
  const currentPrice = parseFloat((currentValue / shares).toFixed(4))

  return {
    ticker,
    name,
    shares,
    dividendShares: 0,
    avgCost,
    totalCost,
    currentPrice,
    currentValue,
    gainLoss,
    gainLossPct: parseFloat(((gainLoss / totalCost) * 100).toFixed(2)),
    purchases: [
      {
        _id: faker.database.mongodbObjectId(),
        ticker,
        name,
        shares,
        price: avgCost,
        type: 'buy' as const,
        date: faker.date.past({ years: 1 }).getTime(),
        platform: 'DEGIRO'
      }
    ]
  }
}

export const STOCKS_LIST = [
  makePosition('TEF.MC', 'Telefónica'),
  makePosition('ITX.MC', 'Inditex'),
  makePosition('SAN.MC', 'Santander')
]

export const STOCKS_SUMMARY_DATA = {
  totalCost: parseFloat(STOCKS_LIST.reduce((acc, p) => acc + p.totalCost, 0).toFixed(2)),
  totalValue: parseFloat(STOCKS_LIST.reduce((acc, p) => acc + (p.currentValue ?? 0), 0).toFixed(2))
}

export const stocksHandlers = [
  http.get('/stocks/summary', () => {
    return HttpResponse.json(STOCKS_SUMMARY_DATA)
  }),
  http.get('/stocks', () => {
    return HttpResponse.json(STOCKS_LIST)
  }),
  http.post('/stocks', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({
      _id: faker.database.mongodbObjectId(),
      ...body
    })
  }),
  http.delete('/stocks/:id', () => {
    return new HttpResponse(null, { status: 204 })
  })
]
