import { faker } from '@faker-js/faker'
import {
  AccountModel,
  CategoryModel,
  IAccount,
  ICategory, IStore,
  IUser, StoreModel, TransactionModel,
  TransactionType,
  UserModel
} from '@soker90/finper-models'

import {
  MAX_USERNAME_LENGTH, MIN_LENGTH_USERNAME,
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

export const insertAccount = async (params: { name?: string, bank?: string, balance?: number, isActive?: boolean, user?: string } = {}): Promise<IAccount> => {
  return AccountModel.create({
    name: params.name ?? faker.finance.accountName(),
    bank: params.bank ?? faker.lorem.word(),
    balance: params.balance ?? faker.datatype.number(),
    isActive: params.isActive ?? faker.datatype.boolean(),
    user: params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
}

export const insertCategory = async (params: Record<string, string> = {}): Promise<ICategory> => {
  return CategoryModel.create({
    name: params.name ?? faker.commerce.department(),
    type: params.type ?? Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    root: params.root ?? Math.random() > 0.5
  })
}

export const insertStore = async (params: Record<string, string> = {}): Promise<IStore> => {
  return StoreModel.create({
    name: params.name ?? faker.company.companyName()
  })
}

export const insertTransaction = async (params: Record<string, string | number> = {}): Promise<any> => {
  return TransactionModel.create({
    date: params.date ?? faker.date.past().getTime(),
    category: params.category ?? (await insertCategory()),
    amount: params.amount ?? faker.datatype.number(),
    type: params.type ?? Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    account: params.account ?? (await insertAccount()),
    note: params.note ?? faker.lorem.sentence(),
    store: params.store ?? (await insertStore())
  })
}
