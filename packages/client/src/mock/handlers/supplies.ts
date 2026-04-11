import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

const SUPPLY_TYPES = ['electricity', 'water', 'gas', 'internet'] as const

const makeSupply = (propertyId: string) => ({
  _id: faker.database.mongodbObjectId(),
  type: faker.helpers.arrayElement(SUPPLY_TYPES),
  propertyId
})

const makeProperty = () => {
  const _id = faker.database.mongodbObjectId()
  return { _id, name: faker.location.streetAddress(), supplies: [makeSupply(_id)] }
}

const makeReading = (supplyId: string) => {
  const startDate = faker.date.recent({ days: 60 }).getTime()
  return {
    _id: faker.database.mongodbObjectId(),
    supplyId,
    startDate,
    endDate: startDate + 30 * 24 * 60 * 60 * 1000,
    consumption: faker.number.int({ min: 50, max: 500 })
  }
}

export const PROPERTIES_LIST = Array.from({ length: 2 }, makeProperty)

export const suppliesHandlers = [
  http.get('/supplies', () => HttpResponse.json(PROPERTIES_LIST)),

  // Properties — rutas estáticas ANTES de /supplies/:id
  http.post('/supplies/properties', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({ _id: faker.database.mongodbObjectId(), ...body, supplies: [] })
  }),
  http.put('/supplies/properties/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, any>
    const found = PROPERTIES_LIST.find(p => p._id === params.id) ?? PROPERTIES_LIST[0]
    return HttpResponse.json({ ...found, ...body })
  }),
  http.delete('/supplies/properties/:id', () => new HttpResponse(null, { status: 204 })),

  // Readings — rutas estáticas ANTES de /supplies/:id
  http.get('/supplies/readings/supply/:supplyId', ({ params }) => {
    return HttpResponse.json(Array.from({ length: 3 }, () => makeReading(params.supplyId as string)))
  }),
  http.post('/supplies/readings', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({ _id: faker.database.mongodbObjectId(), ...body })
  }),
  http.put('/supplies/readings/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({ _id: params.id, ...body })
  }),
  http.delete('/supplies/readings/:id', () => new HttpResponse(null, { status: 204 })),

  // Supplies CRUD — dinámico al final
  http.post('/supplies', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({ _id: faker.database.mongodbObjectId(), ...body })
  }),
  http.put('/supplies/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({ _id: params.id, ...body })
  }),
  http.delete('/supplies/:id', () => new HttpResponse(null, { status: 204 }))
]
