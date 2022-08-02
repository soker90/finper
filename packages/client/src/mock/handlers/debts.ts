import { rest, RestContext, RestRequest } from 'msw'

export const debtsHandlers = [
  rest.post('/debts', (req: RestRequest, res: any, ctx: RestContext) => {
    return res(
      ctx.status(200),
      ctx.json({
        to: [],
        from: [],
        debtsByPerson: []
      }))
  })
]
