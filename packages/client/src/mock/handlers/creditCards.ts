import { http, HttpResponse } from 'msw'

export const creditCardHandlers = [
  http.get('*/credit-cards', () => {
    return HttpResponse.json([
      {
        id: 'card-1',
        _id: 'card-1',
        name: 'Visa Pass',
        accountId: 'acc-1',
        account: { id: 'acc-1', _id: 'acc-1', name: 'Cuenta Nómina', bank: 'BBVA', balance: 1200 },
        limit: 2000,
        currentDebt: 150,
        user: 'testuser'
      }
    ])
  }),

  http.get('*/credit-cards/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      _id: params.id,
      name: 'Visa Pass',
      accountId: 'acc-1',
      account: { id: 'acc-1', _id: 'acc-1', name: 'Cuenta Nómina', bank: 'BBVA', balance: 1200 },
      limit: 2000,
      currentDebt: 150,
      user: 'testuser'
    })
  }),

  http.get('*/credit-cards/:id/movements', () => {
    return HttpResponse.json([
      {
        id: 'mov-1',
        _id: 'mov-1',
        creditCardId: 'card-1',
        date: 1700000000000,
        amount: 150,
        type: 'expense',
        categoryId: 'cat-1',
        category: { id: 'cat-1', _id: 'cat-1', name: 'Supermercado', type: 'expense' },
        status: 'pending',
        user: 'testuser'
      }
    ])
  }),

  http.post('*/credit-cards', async ({ request }) => {
    const body: any = await request.json()
    return HttpResponse.json({
      id: 'card-new',
      _id: 'card-new',
      name: body.name,
      accountId: body.accountId,
      limit: body.limit || null,
      currentDebt: 0,
      user: 'testuser'
    }, { status: 201 })
  }),

  http.post('*/credit-cards/:id/pay-debt', () => {
    return HttpResponse.json({
      card: {
        id: 'card-1',
        _id: 'card-1',
        name: 'Visa Pass',
        currentDebt: 0
      },
      paidCount: 1,
      totalPaid: 150
    })
  }),

  http.patch('*/credit-cards/:id', async ({ params, request }) => {
    const body: any = await request.json()
    return HttpResponse.json({
      id: params.id,
      _id: params.id,
      name: body.name ?? 'Visa Pass',
      accountId: body.accountId ?? 'acc-1',
      limit: body.limit ?? 2000,
      currentDebt: 150,
      user: 'testuser'
    })
  }),

  http.delete('*/credit-cards/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('*/credit-cards/:id/movements/:movementId', async ({ params, request }) => {
    const body: any = await request.json()
    return HttpResponse.json({
      id: params.movementId,
      _id: params.movementId,
      creditCardId: params.id,
      date: body.date ?? 1700000000000,
      amount: body.amount ?? 150,
      type: body.type ?? 'expense',
      categoryId: body.categoryId ?? 'cat-1',
      category: { id: 'cat-1', _id: 'cat-1', name: 'Supermercado', type: 'expense' },
      storeId: body.storeId ?? null,
      note: body.note ?? null,
      status: 'pending',
      user: 'testuser'
    })
  }),

  http.delete('*/credit-cards/:id/movements/:movementId', () => {
    return new HttpResponse(null, { status: 204 })
  })
]
