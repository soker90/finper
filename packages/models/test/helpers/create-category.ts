import { faker } from '@faker-js/faker'

import { CategoryModel, ICategory, TransactionType } from '../../src'

export default (params = {}): Promise<ICategory> => (
  CategoryModel.create({
    name: faker.commerce.department(),
    type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    root: !(params as ICategory).parent,
    ...params
  })
)
