import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

const ACCOUNTS_LIST = Array.from({ length: 3 }, () => ({
  _id: faker.database.mongodbObjectId(),
  name: faker.finance.accountName(),
  bank: faker.company.name(),
  balance: faker.number.float({ min: 100, max: 10000, multipleOf: 0.01 })
}))

export const accountsHandlers = [
  http.get('/accounts', () => {
    return HttpResponse.json(ACCOUNTS_LIST)
  })
]
