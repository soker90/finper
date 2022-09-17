import { faker } from '@faker-js/faker'

import { LoanHistoryModel, LoanHistoryType, ILoanHistory } from '../../src'

const createLoanHistory = async (params = {}): Promise<ILoanHistory> => (
  LoanHistoryModel.create({
    date: faker.datatype.number(),
    amount: faker.datatype.number(),
    interests: faker.datatype.number(),
    amortization: faker.datatype.number(),
    accumulated: faker.datatype.number(),
    pending: faker.datatype.number(),
    type: Math.random() > 0.5 ? LoanHistoryType.quota : LoanHistoryType.amortization,
    user: faker.internet.userName(),
    ...params
  })
)

export default createLoanHistory
