import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { BudgetModel, IBudget } from '../../src'
import createCategory from './create-category'

export default async (params = {}): Promise<HydratedDocument<IBudget>> => {
  return (
    BudgetModel.create({
      year: faker.date.recent().getFullYear(),
      month: faker.date.recent().getMonth(),
      category: (await createCategory())._id,
      amount: faker.number.int(),
      user: faker.internet.username(),
      ...params
    })
  )
}
