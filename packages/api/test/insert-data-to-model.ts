import { faker } from '@faker-js/faker'
import {
  AccountModel,
  CategoryModel,
  IAccount,
  ICategory,
  IUser,
  TransactionType,
  UserModel
} from '@soker90/finper-models'

import {
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH
} from '../src/config/inputs'

export async function insertCredentials (params: Record<string, string | boolean> = {}): Promise<IUser> {
  const parsedParams: Record<string, string | boolean> = {}

  if (params.password) {
    parsedParams.password = params.password
  }

  if (params.username) {
    parsedParams.username = (params.username as string).slice(0, MAX_USERNAME_LENGTH).toLowerCase()
  }

  return await UserModel.create({
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

export const insertCategory = async (params: Record<string, string> = {}): Promise<ICategory> => {
  return CategoryModel.create({
    name: params.name ?? faker.commerce.department(),
    type: params.type ?? Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    root: params.root ?? Math.random() > 0.5
  })
}
