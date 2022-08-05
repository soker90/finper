import { faker } from '@faker-js/faker'

import { BudgetModel, IBudget } from '../../src'
import createCategory from './create-category'

const generateCategories = () => Promise.all(Array.from({
  length: faker.datatype.number({ min: 1, max: 5 })
},
() => createCategory()
))

export default async (params = {}): Promise<IBudget> => {
  let budget: any[] = []
  await generateCategories().then(categories => {
    budget = categories.map(category => ({
      category: category._id,
      amount: faker.datatype.number()
    }))
  })

  return (
    BudgetModel.create({
      year: faker.date.recent().getFullYear(),
      month: faker.date.recent().getMonth(),
      budget,
      user: faker.internet.userName(),
      ...params
    })
  )
}
