import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { SupplyModel, ISupply, SUPPLY_TYPE } from '../../src'
import createProperty from './create-property'

export default async (params: any = {}): Promise<HydratedDocument<ISupply>> => {
  const propertyId = params.propertyId || (await createProperty())._id

  return SupplyModel.create({
    name: faker.company.name(),
    type: faker.helpers.objectValue(SUPPLY_TYPE),
    propertyId,
    user: faker.internet.username(),
    ...params
  })
}
