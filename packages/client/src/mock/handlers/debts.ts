import { http, HttpResponse } from 'msw'

export const debtsHandlers = [
  http.get('/debts', () => {
    return HttpResponse.json([])
  }),

  http.post('/debts', () => {
    return HttpResponse.json({
      to: [],
      from: [],
      debtsByPerson: []
    })
  })
]
