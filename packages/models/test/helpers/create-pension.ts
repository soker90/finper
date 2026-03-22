import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { PensionModel, IPension } from '../../src'

export default async (params = {}): Promise<HydratedDocument<IPension>> => {
  return (
    PensionModel.create({
      date: faker.date.recent().getTime(),
      employeeAmount: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
      employeeUnits: faker.number.float({ min: 1, max: 100, fractionDigits: 5 }),
      companyAmount: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
      companyUnits: faker.number.float({ min: 1, max: 100, fractionDigits: 5 }),
      value: faker.number.float({ fractionDigits: 2 }),
      user: faker.internet.username(),
      ...params
    })
  )
}
