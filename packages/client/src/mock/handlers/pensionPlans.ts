import { http, HttpResponse } from 'msw'

let plans: Array<Record<string, any>> = [
  {
    id: 'plan-1',
    _id: 'plan-1',
    name: 'Plan de pensiones',
    amount: 500,
    units: 50,
    employeeAmount: 200,
    companyAmount: 300,
    total: 550,
    user: 'testuser'
  }
]

let movements: Array<Record<string, any>> = [
  {
    id: 'mov-1',
    _id: 'mov-1',
    planId: 'plan-1',
    date: 1700000000000,
    employeeAmount: 50,
    employeeUnits: 5,
    companyAmount: 100,
    companyUnits: 10,
    value: 11,
    user: 'testuser'
  }
]

export const pensionPlansHandlers = [
  http.get('*/pension-plans', () => {
    return HttpResponse.json(plans)
  }),

  http.get('*/pension-plans/:id', ({ params }) => {
    const plan = plans.find((p) => p.id === params.id)
    if (!plan) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(plan)
  }),

  http.get('*/pension-plans/:id/movements', ({ params }) => {
    return HttpResponse.json(movements.filter((movement) => movement.planId === params.id))
  }),

  http.post('*/pension-plans', async ({ request }) => {
    const body: any = await request.json()
    const plan = {
      id: 'plan-new',
      _id: 'plan-new',
      name: body.name,
      amount: 0,
      units: 0,
      employeeAmount: 0,
      companyAmount: 0,
      total: 0,
      user: 'testuser'
    }
    plans = [...plans, plan]
    return HttpResponse.json(plan, { status: 201 })
  }),

  http.patch('*/pension-plans/:id', async ({ params, request }) => {
    const body: any = await request.json()
    const existing = plans.find((p) => p.id === params.id)
    const updated = { ...existing, ...body, id: params.id, _id: params.id }
    plans = plans.map((p) => (p.id === params.id ? updated : p))
    return HttpResponse.json(updated)
  }),

  http.delete('*/pension-plans/:id', ({ params }) => {
    plans = plans.filter((p) => p.id !== params.id)
    movements = movements.filter((m) => m.planId !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/pension-plans/:id/movements', async ({ params, request }) => {
    const body: any = await request.json()
    const movement = {
      id: `mov-${movements.length + 1}`,
      _id: `mov-${movements.length + 1}`,
      planId: params.id as string,
      date: body.date,
      employeeAmount: body.employeeAmount,
      employeeUnits: body.employeeUnits,
      companyAmount: body.companyAmount,
      companyUnits: body.companyUnits,
      value: body.value,
      user: 'testuser'
    }
    movements = [...movements, movement]
    return HttpResponse.json(movement, { status: 201 })
  }),

  http.patch('*/pension-plans/:id/movements/:movementId', async ({ params, request }) => {
    const body: any = await request.json()
    const existing = movements.find((movement) => movement.id === params.movementId)
    const updated = { ...existing, ...body, id: params.movementId, _id: params.movementId, planId: params.id }
    movements = movements.map((movement) => (movement.id === params.movementId ? updated : movement))
    return HttpResponse.json(updated)
  }),

  http.delete('*/pension-plans/:id/movements/:movementId', ({ params }) => {
    movements = movements.filter((movement) => movement.id !== params.movementId)
    return new HttpResponse(null, { status: 204 })
  })
]
