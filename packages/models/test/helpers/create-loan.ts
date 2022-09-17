import { faker } from '@faker-js/faker'

import { LoanModel, ILoan } from '../../src'

const saving = Array.from({ length: (Math.random() * 3) + 1 }).map(() => ({
  cost: faker.datatype.number(),
  date: faker.datatype.number(),
  saving: faker.datatype.number(),
  accumulated: faker.datatype.number(),
  pending: faker.datatype.number(),
  finishDate: faker.datatype.number()
}))

const createLoan = async (params = {}): Promise<ILoan> => (
  LoanModel.create({
    date: faker.datatype.number(),
    name: faker.finance.accountName(),
    amount: faker.datatype.number(),
    interest: faker.datatype.number(),
    saving,
    user: faker.internet.userName(),
    ...params
  })
)

export default createLoan
