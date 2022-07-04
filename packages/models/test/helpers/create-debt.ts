import { faker } from '@faker-js/faker'

import { DebtModel, DebtType, IDebt } from '../../src'

const createDebt = async (params = {}): Promise<IDebt> => (
  DebtModel.create({
    from: faker.name.firstName(),
    date: faker.datatype.number(),
    amount: faker.datatype.number(),
    paymentDate: faker.datatype.number(),
    concept: faker.lorem.words(4),
    type: Math.random() > 0.5 ? DebtType.TO : DebtType.FROM,
    user: faker.internet.userName(),
    ...params
  })
)

export default createDebt
