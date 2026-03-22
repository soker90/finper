import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { StoreModel, IStore } from '../../src'

export default (params = {}): Promise<HydratedDocument<IStore>> => (
  StoreModel.create({
    name: faker.company.name(),
    user: faker.internet.username(),
    ...params
  })
)
