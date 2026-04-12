import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

// ── IDs fijos para tests deterministas ────────────────────────────────────────
export const PROPERTY_ID = 'prop-test-1'
export const SUPPLY_WATER_ID = 'supply-water-1'
export const SUPPLY_ELEC_ID = 'supply-elec-1'

const CURRENT_YEAR = new Date().getFullYear()

// Lecturas fijas para el suministro de agua (año actual)
export const READINGS_LIST = [0, 1, 2].map((i) => ({
  _id: `reading-${i + 1}`,
  supplyId: SUPPLY_WATER_ID,
  startDate: new Date(CURRENT_YEAR, i * 3, 1).getTime(),
  endDate: new Date(CURRENT_YEAR, i * 3 + 2, 28).getTime(),
  consumption: 100 + i * 50
}))

export const PROPERTIES_LIST = [
  {
    _id: PROPERTY_ID,
    name: 'Casa Principal',
    supplies: [
      { _id: SUPPLY_WATER_ID, type: 'water', propertyId: PROPERTY_ID },
      { _id: SUPPLY_ELEC_ID, type: 'electricity', propertyId: PROPERTY_ID }
    ]
  }
]

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
    return HttpResponse.json(READINGS_LIST.filter(r => r.supplyId === params.supplyId))
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
