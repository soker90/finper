import { faker } from '@faker-js/faker'

import { CategoryModel, ICategory, TransactionType } from '../../src'

const createCategory = async (params = {}): Promise<ICategory> => (
  CategoryModel.create({
    name: faker.commerce.department(),
    type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    parent: Math.random() > 0.5 ? undefined : (await createCategory({ name: 'root' }))._id,
    user: faker.internet.username(),
    ...params
  })
)

export default createCategory
