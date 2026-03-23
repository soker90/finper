import { http, HttpResponse } from 'msw'

export const ticketsHandlers = [
  http.get('/tickets', () => {
    return HttpResponse.json({ tickets: [], total: 0 })
  })
]
