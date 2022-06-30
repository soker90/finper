import { faker } from '@faker-js/faker'

import { AccountModel, IAccount } from '../../src'

export default async (params = {}): Promise<IAccount> => (
  AccountModel.create({
    name: faker.finance.accountName(),
    bank: faker.lorem.word(),
    balance: faker.datatype.number(),
    isActive: faker.datatype.boolean(),
    user: faker.internet.userName(),
    ...params
  })
)
