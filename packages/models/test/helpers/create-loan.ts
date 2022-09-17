import { faker } from '@faker-js/faker'

import { LoanModel, LoanType, ILoan } from '../../src'

const createLoan = async (params = {}): Promise<ILoan> => (
  LoanModel.create({
    date: faker.datatype.number(),
    amount: faker.datatype.number(),
    interests: faker.datatype.number(),
    amortization: faker.datatype.number(),
    accumulated: faker.datatype.number(),
    pending: faker.datatype.number(),
    type: Math.random() > 0.5 ? LoanType.quota : LoanType.amortization,
    user: faker.internet.userName(),
    ...params
  })
)

export default createLoan
