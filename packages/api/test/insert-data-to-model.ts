import { faker } from '@faker-js/faker'
import {
  AccountModel,
  BudgetModel,
  CategoryModel, DebtModel, DebtType,
  IAccount,
  IDebt, IStore,
  IUser, LoanModel, StoreModel, TransactionModel,
  PensionModel, IPension,
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
    password: faker.internet.password({ length: MIN_PASSWORD_LENGTH }),
    username: faker.internet.userName().slice(0, MAX_USERNAME_LENGTH).toLowerCase(),
    ...parsedParams
  })
}

export const insertAccount = async (params: { name?: string, bank?: string, balance?: number, isActive?: boolean, user?: string } = {}): Promise<IAccount> => {
  return AccountModel.create({
    name: params.name ?? faker.finance.accountName(),
    bank: params.bank ?? faker.lorem.word(),
    balance: params.balance ?? faker.number.int(),
    isActive: params.isActive ?? faker.datatype.boolean(),
    user: params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
}

export const insertCategory = async (params: Record<string, any> = {}): Promise<any> => {
  const user = params.user ?? generateUsername()
  const parent = params.parent ?? params.root
    ? false
    : (await insertCategory({
        user,
        root: true,
        type: params.type
      }))._id

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
    name: params.name ?? faker.company.name(),
    user: params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
}

export const insertTransaction = async (params: Record<string, string | number> = {}): Promise<any> => {
  const user = (params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()) as string
  return TransactionModel.create({
    date: params.date ?? faker.date.past().getTime(),
    category: params.category ?? (await insertCategory({ user })),
    amount: params.amount ?? faker.number.int(),
    type: params.type ?? Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
    account: params.account ?? (await insertAccount({ user })),
    note: params.note ?? faker.lorem.sentence(),
    store: params.store ?? (await insertStore({ user })),
    user
  })
}

export const insertDebt = async (params: Record<string, string | number> = {}): Promise<IDebt> => {
  return DebtModel.create({
    from: params.from ?? faker.person.firstName(),
    date: params.date ?? faker.number.int(),
    amount: params.amount ?? faker.number.int(),
    ...(params.paymentDate !== 0 && { paymentDate: params.paymentDate ?? faker.number.int() }),
    concept: params.concept ?? faker.lorem.words(4),
    type: params.type ?? (Math.random() > 0.5 ? DebtType.TO : DebtType.FROM),
    user: params.user ?? faker.internet.username().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
}

export const insertBudget = async (params: Record<string, any> = {}): Promise<any> => {
  const user = (params.user ?? generateUsername()) as string
  const budget = await BudgetModel.create({
    year: params.year ?? faker.date.past().getFullYear(),
    month: params.month ?? faker.date.past().getMonth(),
    category: params.category ?? (await insertCategory({ user, ...(params.type && { type: params.type }) }))._id,
    amount: faker.number.int(),
    user
  })

  return params.category ? budget.populate('category') : budget
}

export const insertPension = async (params: Record<string, string | number> = {}): Promise<IPension> => {
  return PensionModel.create({
    date: params.date ?? faker.number.int(),
    value: params.value ?? faker.number.int(),
    companyAmount: params.companyAmount ?? faker.number.int(),
    companyUnits: params.companyUnits ?? faker.number.int(),
    employeeUnits: params.employeeUnits ?? faker.number.int(),
    employeeAmount: params.employeeAmount ?? faker.number.int(),
    user: params.user ?? faker.internet.username().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  })
}

export const insertLoan = async (params: Record<string, any> = {}): Promise<any> => {
  const user = (params.user ?? generateUsername()) as string

  const saving = params.saving ?? []

  return LoanModel.create({
    user,
    date: params.date ?? faker.date.past().getTime(),
    interest: params.interest ?? faker.datatype.number({ min: 1, precision: 0.01 }),
    name: params.name ?? faker.finance.accountName(),
    saving
  })
}
