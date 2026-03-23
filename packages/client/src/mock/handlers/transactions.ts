import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

export const TRANSACTIONS_LIST = Array.from({ length: 5 }, () => ({
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

const now = new Date()
export const TRANSACTIONS_SUMMARY_LIST = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    income: faker.number.float({ min: 1000, max: 3000, multipleOf: 0.01 }),
    expenses: faker.number.float({ min: 500, max: 2500, multipleOf: 0.01 })
  }
})

export const transactionsHandlers = [
  http.get('/transactions/summary', () => {
    return HttpResponse.json(TRANSACTIONS_SUMMARY_LIST)
  }),
  http.get('/transactions', () => {
    return HttpResponse.json(TRANSACTIONS_LIST)
  })
]
