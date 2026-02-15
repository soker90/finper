import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { AccountModel, IAccount } from '../../src'

export default async (params = {}): Promise<HydratedDocument<IAccount>> => (
  AccountModel.create({
    name: faker.finance.accountName(),
    bank: faker.lorem.word(),
    balance: faker.number.int(),
    isActive: faker.datatype.boolean(),
    user: faker.internet.username(),
    ...params
  })
)
