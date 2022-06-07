import { faker } from '@faker-js/faker'
import { AccountModel, IAccount, UserModel } from '@soker90/finper-models'

import {
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH
} from '../src/config/inputs'

export async function insertCredentials (params: Record<string, string | boolean> = {}): Promise<void> {
  const parsedParams: Record<string, string | boolean> = {}

  if (params.password) {
    parsedParams.password = params.password
  }

  if (params.username) {
    parsedParams.username = (params.username as string).slice(0, MAX_USERNAME_LENGTH).toLowerCase()
  }

  await UserModel.create({
    password: faker.internet.password(MIN_PASSWORD_LENGTH),
    username: faker.internet.userName().slice(0, MAX_USERNAME_LENGTH).toLowerCase(),
    ...parsedParams
  })
}

export const insertAccount = async (params: Record<string, string | number | boolean> = {}): Promise<IAccount> => {
  return AccountModel.create({
    name: params.name ?? faker.finance.accountName(),
    bank: params.bank ?? faker.lorem.word(),
    balance: params.balance ?? faker.finance.amount(),
    isActive: params.isActive ?? faker.datatype.boolean(),
    user: params.user ?? faker.internet.userName().slice(0, MAX_USERNAME_LENGTH).toLowerCase()
  })
}
