import { faker } from '@faker-js/faker'

import { AccountModel, IAccount } from '../../src'

export default async (params = {}): Promise<IAccount> => (
  AccountModel.create({
    name: faker.finance.accountName(),
    bank: faker.lorem.word(),
    balance: faker.number.int(),
    isActive: faker.datatype.boolean(),
    user: faker.internet.username(),
    ...params
  })
)
