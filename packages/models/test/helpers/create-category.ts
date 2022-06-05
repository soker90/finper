import { faker } from '@faker-js/faker'

import { CategoryModel, ICategory, TransactionType } from '../../src'

export default (params = {}): Promise<ICategory> => (
  CategoryModel.create({
    name: faker.finance.transactionDescription(),
    type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    ...params
  })
)
