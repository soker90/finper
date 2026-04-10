import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

export const CATEGORIES_LIST = [
  { _id: faker.database.mongodbObjectId(), name: 'Ocio' },
  { _id: faker.database.mongodbObjectId(), name: 'Alimentación' },
  { _id: faker.database.mongodbObjectId(), name: 'Suscripciones' }
]

export const categoriesHandlers = [
  http.get('/categories', () => {
    return HttpResponse.json(CATEGORIES_LIST)
  })
]
