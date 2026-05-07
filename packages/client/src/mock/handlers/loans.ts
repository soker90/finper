import { http, HttpResponse } from 'msw'
import { MOCK_SIMULATION_RESULT } from '../fixtures/loan-simulation'

export const loansHandlers = [
  http.get('/loans', () => {
    return HttpResponse.json([])
  }),
  http.post('/loans/:id/simulate-payoff', () => {
    return HttpResponse.json(MOCK_SIMULATION_RESULT)
  })
]
