import { faker } from '@faker-js/faker'

import { StoreModel, IStore } from '../../src'

export default (params = {}): Promise<IStore> => (
  StoreModel.create({
    name: faker.company.name(),
    user: faker.internet.userName(),
    ...params
  })
)
