import { http, HttpResponse } from 'msw'
import type { PensionPlan, PensionTransaction } from 'types'

type MockMovement = PensionTransaction & { id: string, planId: string, user: string }

let plans: PensionPlan[] = [
  {
    id: 'plan-1',
    _id: 'plan-1',
    name: 'Plan de pensiones',
    color: '#4CAF50',
    amount: 500,
    units: 50,
    employeeAmount: 200,
    companyAmount: 300,
    total: 550,
    user: 'testuser'
  }
]

let movements: MockMovement[] = [
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

let planIdCounter = 1

export const pensionPlansHandlers = [
  http.get('*/pension-plans', () => {
    return HttpResponse.json(plans)
  }),

  http.get('*/pension-plans/movements', () => {
    return HttpResponse.json([...movements].sort((a, b) => b.date - a.date))
  }),

  http.get('*/pension-plans/:id', ({ params }) => {
    const plan = plans.find((plan) => plan.id === params.id)
    if (!plan) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(plan)
  }),

  http.get('*/pension-plans/:id/movements', ({ params }) => {
    return HttpResponse.json(movements.filter((movement) => movement.planId === params.id))
  }),

  http.post('*/pension-plans', async ({ request }) => {
    const body = await request.json() as Partial<PensionPlan>
    planIdCounter += 1
    const id = `plan-${planIdCounter}`
    const plan: PensionPlan = {
      id,
      _id: id,
      name: body.name ?? '',
      color: body.color ?? '#4CAF50',
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
    const body = await request.json() as Partial<PensionPlan>
    const existing = plans.find((plan) => plan.id === params.id)
    if (!existing) return new HttpResponse(null, { status: 404 })

    const updated = { ...existing, ...body, id: params.id as string, _id: params.id as string }
    plans = plans.map((plan) => (plan.id === params.id ? updated : plan))
    return HttpResponse.json(updated)
  }),

  http.delete('*/pension-plans/:id', ({ params }) => {
    plans = plans.filter((plan) => plan.id !== params.id)
    movements = movements.filter((movement) => movement.planId !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/pension-plans/:id/movements', async ({ params, request }) => {
    const body = await request.json() as Partial<PensionTransaction>
    const id = `mov-${movements.length + 1}`
    const movement: MockMovement = {
      id,
      _id: id,
      planId: params.id as string,
      date: body.date ?? Date.now(),
      employeeAmount: body.employeeAmount ?? 0,
      employeeUnits: body.employeeUnits ?? 0,
      companyAmount: body.companyAmount ?? 0,
      companyUnits: body.companyUnits ?? 0,
      value: body.value ?? 0,
      user: 'testuser'
    }
    movements = [...movements, movement]
    return HttpResponse.json(movement, { status: 201 })
  }),

  http.patch('*/pension-plans/:id/movements/:movementId', async ({ params, request }) => {
    const body = await request.json() as Partial<PensionTransaction>
    const existing = movements.find((movement) => movement.id === params.movementId && movement.planId === params.id)
    if (!existing) return new HttpResponse(null, { status: 404 })

    const updated = { ...existing, ...body, id: params.movementId as string, _id: params.movementId as string, planId: params.id as string }
    movements = movements.map((movement) => (movement.id === params.movementId ? updated : movement))
    return HttpResponse.json(updated)
  }),

  http.delete('*/pension-plans/:id/movements/:movementId', ({ params }) => {
    const existing = movements.find((movement) => movement.id === params.movementId && movement.planId === params.id)
    if (!existing) return new HttpResponse(null, { status: 404 })

    movements = movements.filter((movement) => movement.id !== params.movementId)
    return new HttpResponse(null, { status: 204 })
  })
]
