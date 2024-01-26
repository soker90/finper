import { faker } from '@faker-js/faker'

import { PensionModel, IPension } from '../../src'

export default async (params = {}): Promise<IPension> => {
  return (
    PensionModel.create({
      date: faker.date.recent().getTime(),
      employeeAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
      employeeUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
      companyAmount: faker.number.float({ min: 1, max: 100, precision: 2 }),
      companyUnits: faker.number.float({ min: 1, max: 100, precision: 5 }),
      value: faker.number.float({ precision: 2 }),
      user: faker.internet.userName(),
      ...params
    })
  )
}
