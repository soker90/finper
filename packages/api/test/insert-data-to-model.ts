import { faker } from '@faker-js/faker'
import {
  AccountModel,
  BudgetModel,
  CategoryModel, DebtModel, DebtType,
  IAccount, ICategory,
  IDebt, IStore,
  IUser, StoreModel, TransactionModel,
  TransactionType,
  UserModel
} from '@soker90/finper-models'

import {
  MAX_USERNAME_LENGTH, MIN_LENGTH_USERNAME,
  MIN_PASSWORD_LENGTH
} from '../src/config/inputs'
import { generateUsername } from './generate-values'

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

export const insertCategory = async (params: Record<string, any> = {}): Promise<ICategory> => {
  const user = params.user ?? generateUsername()
  const parent = params.parent ?? params.root ? false : (await insertCategory({ user, root: true, type: params.type }))._id

  const category = await CategoryModel.create({
    name: params.name ?? faker.commerce.department(),
    type: params.type ?? (Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income),
    ...(parent && { parent }),
    user
  })

  return category.populate('parent')
}

export const insertStore = async (params: Record<string, string> = {}): Promise<IStore> => {
  return StoreModel.create({
    name: params.name ?? faker.company.companyName(),
    user: params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
}

export const insertTransaction = async (params: Record<string, string | number> = {}): Promise<any> => {
  const user = (params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()) as string
  return TransactionModel.create({
    date: params.date ?? faker.date.past().getTime(),
    category: params.category ?? (await insertCategory({ user })),
    amount: params.amount ?? faker.datatype.number(),
    type: params.type ?? Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    account: params.account ?? (await insertAccount({ user })),
    note: params.note ?? faker.lorem.sentence(),
    store: params.store ?? (await insertStore({ user })),
    user
  })
}

export const insertDebt = async (params: Record<string, string | number> = {}): Promise<IDebt> => {
  return DebtModel.create({
    from: params.from ?? faker.name.firstName(),
    date: params.date ?? faker.datatype.number(),
    amount: params.amount ?? faker.datatype.number(),
    ...(params.paymentDate !== 0 && { paymentDate: params.paymentDate ?? faker.datatype.number() }),
    concept: params.concept ?? faker.lorem.words(4),
    type: params.type ?? (Math.random() > 0.5 ? DebtType.TO : DebtType.FROM),
    user: params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
}

export const insertBudget = async (params: Record<string, any> = {}): Promise<any> => {
  const user = (params.user ?? generateUsername()) as string
  const budget = await BudgetModel.create({
    year: params.year ?? faker.date.past().getFullYear(),
    month: params.month ?? faker.date.past().getMonth(),
    category: params.category ?? (await insertCategory({ user, ...(params.type && { type: params.type }) }))._id,
    amount: faker.datatype.number(),
    user
  })

  return budget.populate('category')
}
