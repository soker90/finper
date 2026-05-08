import { http, HttpResponse } from 'msw'
import { MOCK_FIRE_PROJECTION_RESULT } from '../fixtures/fire-projection'

export const wealthHandlers = [
  http.get('/wealth/fire-projection', () => {
    return HttpResponse.json(MOCK_FIRE_PROJECTION_RESULT)
  })
]
