import { faker } from '@faker-js/faker'

import { PensionModel, IPension } from '../../src'

export default async (params = {}): Promise<IPension> => {
  return (
    PensionModel.create({
      date: faker.date.recent().getTime(),
      employeeAmount: faker.datatype.number({ min: 1, max: 100, precision: 2 }),
      employeeUnits: faker.datatype.number({ min: 1, max: 100, precision: 5 }),
      companyAmount: faker.datatype.number({ min: 1, max: 100, precision: 2 }),
      companyUnits: faker.datatype.number({ min: 1, max: 100, precision: 5 }),
      value: faker.datatype.number({ precision: 2 }),
      user: faker.internet.userName(),
      ...params
    })
  )
}
