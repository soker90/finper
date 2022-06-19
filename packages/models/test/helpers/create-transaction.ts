import { faker } from '@faker-js/faker'

import { ITransaction, TransactionModel, TransactionType } from '../../src'
import createCategory from './create-category'
import createAccount from './create-account'
import createStore from './create-store'

export default async (params = {}): Promise<ITransaction> => (
  TransactionModel.create({
    date: faker.datatype.number(),
    category: (await createCategory())._id,
    amount: faker.finance.amount(),
    type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    account: (await createAccount())._id,
    note: faker.lorem.sentence(),
    store: (await createStore())._id,
    ...params
  })
)
