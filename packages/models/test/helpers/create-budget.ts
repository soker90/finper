import { faker } from '@faker-js/faker'

import { BudgetModel, IBudget } from '../../src'
import createCategory from './create-category'

export default async (params = {}): Promise<IBudget> => {
  return (
    BudgetModel.create({
      year: faker.date.recent().getFullYear(),
      month: faker.date.recent().getMonth(),
      category: (await createCategory())._id,
      amount: faker.datatype.number(),
      user: faker.internet.userName(),
      ...params
    })
  )
}
