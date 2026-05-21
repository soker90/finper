import { http, HttpResponse } from 'msw'

export const goalsHandlers = [
  http.get('/goals', () => {
    return HttpResponse.json([])
  })
]
