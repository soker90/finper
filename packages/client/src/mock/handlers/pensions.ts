import { http, HttpResponse } from 'msw'

export const pensionsHandlers = [
  http.get('/pensions', () => {
    return HttpResponse.json({
      amount: 0,
      units: 0,
      employeeAmount: 0,
      companyAmount: 0,
      transactions: [],
      total: 0
    })
  })
]
