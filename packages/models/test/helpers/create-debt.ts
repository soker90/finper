import { faker } from '@faker-js/faker'

import { DebtModel, DebtType, IDebt } from '../../src'

const createDebt = async (params = {}): Promise<IDebt> => (
  DebtModel.create({
    from: faker.person.firstName(),
    date: faker.number.int(),
    amount: faker.number.int(),
    paymentDate: faker.number.int(),
    concept: faker.lorem.words(4),
    type: Math.random() > 0.5 ? DebtType.TO : DebtType.FROM,
    user: faker.internet.username(),
    ...params
  })
)

export default createDebt
