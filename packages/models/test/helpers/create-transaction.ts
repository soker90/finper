import { faker } from '@faker-js/faker'

import { ITransaction, TransactionModel, TransactionType } from '../../src'

export default (params = {}): Promise<ITransaction> => (
  TransactionModel.create({
    date: faker.datatype.number(),
    category: faker.finance.transactionDescription(),
    categoryId: faker.datatype.uuid(),
    amount: faker.finance.amount(),
    type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    account: faker.finance.accountName(),
    accountId: faker.datatype.uuid(),
    bank: faker.finance.accountName(),
    note: faker.lorem.sentence(),
    storeId: faker.datatype.uuid(),
    store: faker.company.companyName(),
    ...params
  })
)
