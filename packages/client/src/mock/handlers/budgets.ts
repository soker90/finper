import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

export const BUDGETS_LIST = {
  expenses: Array.from({ length: 3 }, () => ({
    name: faker.commerce.department(),
    id: faker.database.mongodbObjectId(),
    budgets: [{ amount: faker.number.float({ multipleOf: 0.01 }), real: faker.number.float({ multipleOf: 0.01 }) }]
  })),
  incomes: Array.from({ length: 3 }, () => ({
    name: faker.commerce.department(),
    id: faker.database.mongodbObjectId(),
    budgets: [{ amount: faker.number.float({ multipleOf: 0.01 }), real: faker.number.float({ multipleOf: 0.01 }) }]
  }))
}

const BUDGETS_LIST_EMPTY = { expenses: [], incomes: [] }

export const budgetsHandlers = [
  http.post('/budgets', ({ request }) => {
    const url = new URL(request.url)
    const month = url.searchParams.get('month')
    return HttpResponse.json(month === '8' ? BUDGETS_LIST : BUDGETS_LIST_EMPTY)
  }),

  http.get('/budgets', ({ request }) => {
    const url = new URL(request.url)
    const month = url.searchParams.get('month')
    return HttpResponse.json(month === '8' ? BUDGETS_LIST : BUDGETS_LIST_EMPTY)
  })
]
