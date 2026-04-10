import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { DebtModel, IDebt, DEBT } from '../../src'

const createDebt = async (params = {}): Promise<HydratedDocument<IDebt>> => (
  DebtModel.create({
    from: faker.person.firstName(),
    date: faker.number.int(),
    amount: faker.number.int(),
    paymentDate: faker.number.int(),
    concept: faker.lorem.words(4),
    type: Math.random() > 0.5 ? DEBT.TO : DEBT.FROM,
    user: faker.internet.username(),
    ...params
  })
)

export default createDebt
