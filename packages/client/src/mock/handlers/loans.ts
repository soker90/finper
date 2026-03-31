import { http, HttpResponse } from 'msw'

export const loansHandlers = [
  http.get('/loans', () => {
    return HttpResponse.json([])
  })
]
