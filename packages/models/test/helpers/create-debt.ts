import { faker } from '@faker-js/faker'

import { DebtModel, DebtType, IDebt } from '../../src'

export default (params = {}): Promise<IDebt> => (
  DebtModel.create({
    from: faker.name.firstName(),
    date: faker.datatype.number(),
    amount: faker.finance.amount(),
    paymentDate: faker.datatype.number(),
    concept: faker.lorem.words(4),
    type: Math.random() > 0.5 ? DebtType.TO : DebtType.FROM,
    ...params
  })
)
