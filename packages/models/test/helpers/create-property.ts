import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { PropertyModel, IProperty } from '../../src'

export default (params = {}): Promise<HydratedDocument<IProperty>> => (
  PropertyModel.create({
    name: faker.company.name(),
    user: faker.internet.username(),
    ...params
  })
)
