import { rest, RestContext, RestRequest } from 'msw'
import { faker } from '@faker-js/faker'

export const BUDGETS_LIST = {
  expenses: Array.from({ length: 3 }, () => ({
    name: faker.commerce.department(),
    id: faker.database.mongodbObjectId(),
    budgets: [{ amount: faker.datatype.float({ precision: 0.01 }), real: faker.datatype.float({ precision: 0.01 }) }]
  })),
  incomes: Array.from({ length: 3 }, () => ({
    name: faker.commerce.department(),
    id: faker.database.mongodbObjectId(),
    budgets: [{ amount: faker.datatype.float({ precision: 0.01 }), real: faker.datatype.float({ precision: 0.01 }) }]
  }))
}

const BUDGETS_LIST_EMPTY = { expenses: [], incomes: [] }
export const budgetsHandlers = [
  rest.post('/budgets', (req: RestRequest, res: any, ctx: RestContext) => {
    const month = req.url.searchParams.get('month')
    console.log(req.url)
    return res(
      ctx.status(200),
      ctx.json(month === '8' ? BUDGETS_LIST : BUDGETS_LIST_EMPTY)
    )
  })
]
