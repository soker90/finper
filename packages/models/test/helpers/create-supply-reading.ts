import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { SupplyReadingModel, ISupplyReading } from '../../src'
import createSupply from './create-supply'

export default async (params: any = {}): Promise<HydratedDocument<ISupplyReading>> => {
  const supplyId = params.supplyId || (await createSupply())._id

  return SupplyReadingModel.create({
    supplyId,
    startDate: faker.date.past().getTime(),
    endDate: faker.date.recent().getTime(),
    amount: faker.number.float({ min: -50, max: 300, multipleOf: 0.01 }),
    consumption: faker.number.int({ min: 10, max: 100 }),
    user: faker.internet.username(),
    ...params
  })
}
