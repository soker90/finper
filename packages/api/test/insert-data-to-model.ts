import { faker } from '@faker-js/faker'
import {
  AccountModel,
  BudgetModel,
  CategoryModel, DebtModel, DebtType,
  IAccount, IBudget,
  ICategory, IDebt, IStore,
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
    root: params.root ?? Math.random() > 0.5,
    user: params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
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

const generateCategories = () => Promise.all(Array.from({
  length: faker.datatype.number({ min: 1, max: 5 })
},
() => insertCategory()
))

export const insertBudget = async (params: Record<string, string | number> = {}): Promise<any> => {
  let budget: any[] = []
  await generateCategories().then(categories => {
    budget = categories.map(category => ({
      category,
      amount: faker.datatype.number()
    }))
  })
  return BudgetModel.create({
    year: params.year ?? faker.date.past().getFullYear(),
    month: params.month ?? faker.date.past().getMonth(),
    budget: params.budget ?? budget,
    user: params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
}
