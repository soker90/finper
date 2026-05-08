import { http, HttpResponse } from 'msw'

export const statsHandlers = [
  http.get('*/stats/tags/available', () => {
    return HttpResponse.json(['juan', 'viaje-japon', 'casa'])
  }),
  http.get('*/stats/tags/years', () => {
    return HttpResponse.json([2026, 2025, 2024])
  }),
  http.get('*/stats/tags', () => {
    return HttpResponse.json([
      {
        tag: 'juan',
        totalAmount: 1250.50,
        transactionCount: 15,
        byCategory: [
          { categoryId: '1', categoryName: 'Educación', amount: 750.00, count: 9 },
          { categoryId: '2', categoryName: 'Ropa', amount: 300.00, count: 4 },
          { categoryId: '3', categoryName: 'Otros', amount: 200.50, count: 2 }
        ]
      },
      {
        tag: 'viaje-japon',
        totalAmount: 3400.00,
        transactionCount: 24,
        byCategory: [
          { categoryId: '4', categoryName: 'Viajes', amount: 2000.00, count: 10 },
          { categoryId: '5', categoryName: 'Comida', amount: 1400.00, count: 14 }
        ]
      }
    ])
  }),
  http.get('*/stats/tags/:tagName', ({ params }) => {
    const { tagName } = params
    return HttpResponse.json({
      tag: tagName,
      totalAmount: 5500.00,
      years: [
        { year: 2026, totalAmount: 1200, transactionCount: 18 },
        { year: 2025, totalAmount: 2400, transactionCount: 34 },
        { year: 2024, totalAmount: 1900, transactionCount: 29 }
      ]
    })
  }),
  http.get('*/stats/tags/:tagName/:year', ({ params }) => {
    const { tagName, year } = params
    return HttpResponse.json({
      tag: tagName,
      year: Number(year),
      totalAmount: 2400.00,
      transactionCount: 34,
      byCategory: [
        { categoryId: '4', categoryName: 'Viajes', amount: 1600.00, count: 18 },
        { categoryId: '5', categoryName: 'Comida', amount: 800.00, count: 16 }
      ],
      transactions: []
    })
  })
]
