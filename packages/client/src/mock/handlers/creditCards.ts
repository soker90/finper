import { http, HttpResponse } from 'msw'

let movements: Array<Record<string, any>> = [
  {
    id: 'mov-1',
    _id: 'mov-1',
    creditCardId: 'card-1',
    date: 1700000000000,
    amount: 150,
    type: 'expense',
    categoryId: 'cat-1',
    category: { id: 'cat-1', _id: 'cat-1', name: 'Supermercado', type: 'expense' },
    tags: [],
    status: 'pending',
    user: 'testuser'
  }
]

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

  http.get('*/credit-cards/:id/movements', ({ params }) => {
    return HttpResponse.json(movements.filter((movement) => movement.creditCardId === params.id))
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

  http.post('*/credit-cards/:id/movements', async ({ params, request }) => {
    const body: any = await request.json()
    const movement = {
      id: `mov-${movements.length + 1}`,
      _id: `mov-${movements.length + 1}`,
      creditCardId: params.id as string,
      date: body.date,
      amount: body.amount,
      type: body.type ?? 'expense',
      categoryId: body.categoryId,
      category: { id: 'cat-1', _id: 'cat-1', name: 'Supermercado', type: 'expense' },
      storeId: body.storeId ?? null,
      store: body.storeId ? { id: 'store-new', _id: 'store-new', name: body.storeId } : null,
      note: body.note ?? null,
      tags: body.tags ?? [],
      status: 'pending',
      user: 'testuser'
    }
    movements = [...movements, movement]
    return HttpResponse.json(movement, { status: 201 })
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
    const existing = movements.find((movement) => movement.id === params.movementId)
    const updated = {
      ...existing,
      id: params.movementId,
      _id: params.movementId,
      creditCardId: params.id,
      date: body.date ?? existing?.date ?? 1700000000000,
      amount: body.amount ?? existing?.amount ?? 150,
      type: body.type ?? existing?.type ?? 'expense',
      categoryId: body.categoryId ?? existing?.categoryId ?? 'cat-1',
      category: { id: 'cat-1', _id: 'cat-1', name: 'Supermercado', type: 'expense' },
      storeId: body.storeId ?? null,
      store: body.storeId ? { id: 'store-new', _id: 'store-new', name: body.storeId } : null,
      note: body.note ?? null,
      tags: body.tags ?? existing?.tags ?? [],
      status: existing?.status ?? 'pending',
      user: 'testuser'
    }
    movements = movements.map((movement) => movement.id === params.movementId ? updated : movement)
    return HttpResponse.json(updated)
  }),

  http.delete('*/credit-cards/:id/movements/:movementId', ({ params }) => {
    movements = movements.filter((movement) => movement.id !== params.movementId)
    return new HttpResponse(null, { status: 204 })
  })
]
