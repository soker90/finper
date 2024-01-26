import { http, HttpResponse } from 'msw'

export const debtsHandlers = [
  http.post('/debts', () => {
    return HttpResponse.json({
      to: [],
      from: [],
      debtsByPerson: []
    })
  })
]
