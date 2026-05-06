import { http, HttpResponse } from 'msw'

export const loansHandlers = [
  http.get('/loans', () => {
    return HttpResponse.json([])
  }),
  http.post('/loans/:id/simulate-payoff', () => {
    return HttpResponse.json({
      lumpSum: 2000,
      originalMonthsLeft: 60,
      originalMonthlyPayment: 200,
      originalEndDate: new Date('2030-12-01').getTime(),
      optionA: {
        newMonthsLeft: 48,
        newMonthlyPayment: 200,
        monthsSaved: 12,
        monthlySaving: 0,
        totalInterestSaved: 500,
        newEndDate: new Date('2029-12-01').getTime()
      },
      optionB: {
        newMonthsLeft: 60,
        newMonthlyPayment: 170,
        monthsSaved: 0,
        monthlySaving: 30,
        totalInterestSaved: 300,
        newEndDate: new Date('2030-12-01').getTime()
      }
    })
  })
]
