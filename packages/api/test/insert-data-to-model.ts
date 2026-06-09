import { faker } from '@faker-js/faker'
import {
  SUPPLY_TYPE,
  TRANSACTION, LOAN_PAYMENT
} from '@soker90/finper-db'
import { propertyRepository } from '../src/repositories/property.repository'
import { supplyRepository } from '../src/repositories/supply.repository'
import { supplyReadingRepository } from '../src/repositories/supply-reading.repository'

import { db as sqliteDb } from '../src/db'
import hashPassword from '../src/helpers/hash-password'
import { schema, generateId } from '@soker90/finper-db'
const { users } = schema

import {
  MAX_USERNAME_LENGTH, MIN_LENGTH_USERNAME,
  MIN_PASSWORD_LENGTH
} from '../src/config/inputs'
import { generateUsername } from './generate-values'
import { DEBT } from '../src/modules/debts/debts.validators'
import { STOCK_TYPE } from '../src/modules/stocks/stocks.validators'
import { GOAL_COLORS, GOAL_ICONS } from '../src/modules/goals/goals.validators'
import { buildAmortizationTable } from '../src/modules/loans/utils/calcLoanProjection'
import { roundNumber } from '../src/utils/roundNumber'

// En SQLite todas las tablas de datos referencian users.username (FK).
// A diferencia del viejo (Mongo, sin FK), el usuario debe existir antes de
// insertar. ensureUser devuelve el user dado (se asume existente) o crea uno.
const ensureUser = (user?: string): string => {
  if (user) return user
  const username = generateUsername()
  sqliteDb.insert(users).values({
    id: generateId(),
    username,
    password: hashPassword('password'),
    createdAt: new Date()
  }).run()
  return username
}

export const insertCredentials = (params: Record<string, string | boolean> = {}): Promise<{ username: string }> => {
  const username = ((params.username as string) ?? faker.internet.username())
    .slice(0, MAX_USERNAME_LENGTH).toLowerCase()
  const password = (params.password as string) ?? faker.internet.password({ length: MIN_PASSWORD_LENGTH })

  sqliteDb.insert(users).values({
    id: generateId(),
    username,
    password: hashPassword(password),
    createdAt: new Date(),
  }).run()

  return Promise.resolve({ username })
}

export const insertAccount = async (params: Record<string, any> = {}): Promise<any> => {
  const data = {
    id: generateId(),
    name: params.name ?? faker.finance.accountName(),
    bank: params.bank ?? faker.lorem.word(),
    balance: params.balance ?? faker.number.int({ min: 0, max: 100000 }),
    isActive: params.isActive ?? true,
    user: ensureUser(params.user)
  }
  sqliteDb.insert(schema.accounts).values(data).run()
  return data
}

export const insertCategory = async (params: Record<string, any> = {}): Promise<any> => {
  const user = ensureUser(params.user)
  let parentId: string | null = null
  if (params.parentId) {
    parentId = params.parentId
  } else if (!params.root) {
    parentId = (await insertCategory({ user, root: true, type: params.type })).id
  }
  const data = {
    id: generateId(),
    name: params.name ?? faker.commerce.department(),
    type: params.type ?? (Math.random() > 0.5 ? TRANSACTION.Expense : TRANSACTION.Income),
    parentId,
    budgetRuleClass: params.budgetRuleClass ?? null,
    user
  }
  sqliteDb.insert(schema.categories).values(data).run()
  return data
}

export const insertStore = async (params: Record<string, any> = {}): Promise<any> => {
  const data = {
    id: generateId(),
    name: params.name ?? faker.company.name(),
    user: ensureUser(params.user)
  }
  sqliteDb.insert(schema.stores).values(data).run()
  return data
}

export const insertTransaction = async (params: Record<string, any> = {}): Promise<any> => {
  const user = ensureUser(params.user)
  const categoryId = params.categoryId ?? (await insertCategory({ user })).id
  const accountId = params.accountId ?? (await insertAccount({ user })).id
  const storeId = params.storeId ?? (await insertStore({ user })).id
  const data = {
    id: generateId(),
    date: params.date ?? faker.date.past().getTime(),
    categoryId,
    amount: params.amount ?? faker.number.int({ min: 1, max: 1000 }),
    type: params.type ?? (Math.random() > 0.5 ? TRANSACTION.Expense : TRANSACTION.Income),
    accountId,
    note: params.note ?? faker.lorem.sentence(),
    storeId,
    subscriptionId: params.subscriptionId ?? null,
    tags: params.tags ?? [],
    user
  }
  sqliteDb.insert(schema.transactions).values(data).run()
  return data
}

export const insertBudget = async (params: Record<string, any> = {}): Promise<any> => {
  const user = ensureUser(params.user)
  const categoryId = params.categoryId ?? (await insertCategory({ user, ...(params.type && { type: params.type }) })).id
  const data = {
    id: generateId(),
    year: params.year ?? faker.date.past().getFullYear(),
    month: params.month ?? faker.date.past().getMonth(),
    amount: params.amount ?? faker.number.int({ min: 1, max: 5000 }),
    categoryId,
    user
  }
  sqliteDb.insert(schema.budgets).values(data).run()
  return data
}

export const insertLoan = async (params: Record<string, any> = {}): Promise<any> => {
  const user = ensureUser(params.user)
  const accountId = params.accountId ?? (await insertAccount({ user })).id
  const categoryId = params.categoryId ?? (await insertCategory({ user, type: TRANSACTION.Expense })).id
  const initialAmount = params.initialAmount ?? 10000
  const interestRate = params.interestRate ?? 3
  const monthlyPayment = params.monthlyPayment ?? 200
  const startDate = params.startDate ?? Date.now()

  const projection = buildAmortizationTable([], initialAmount, interestRate, monthlyPayment, [], startDate)
  const estimatedCost = roundNumber(projection.reduce((s: number, r: any) => s + r.amount, 0))

  const data = {
    id: generateId(),
    name: params.name ?? faker.lorem.words(2),
    initialAmount,
    pendingAmount: params.pendingAmount ?? initialAmount,
    interestRate,
    startDate,
    monthlyPayment,
    initialEstimatedCost: params.initialEstimatedCost ?? estimatedCost,
    accountId,
    categoryId,
    user
  }
  sqliteDb.insert(schema.loans).values(data).run()
  return data
}

export const insertLoanPayment = async (params: Record<string, any> = {}): Promise<any> => {
  const user = ensureUser(params.user)
  const loanId = params.loanId ?? (await insertLoan({ user })).id
  const principal = params.principal ?? 175
  const accumulatedPrincipal = params.accumulatedPrincipal ?? principal
  const pendingCapital = params.pendingCapital ?? roundNumber(10000 - accumulatedPrincipal)
  const data = {
    id: generateId(),
    loanId,
    date: params.date ?? Date.now(),
    amount: params.amount ?? 200,
    interest: params.interest ?? 25,
    principal,
    accumulatedPrincipal,
    pendingCapital,
    type: params.type ?? LOAN_PAYMENT.ORDINARY,
    user
  }
  sqliteDb.insert(schema.loanPayments).values(data).run()
  return data
}

export const insertLoanEvent = async (params: Record<string, any> = {}): Promise<any> => {
  const user = ensureUser(params.user)
  const loanId = params.loanId ?? (await insertLoan({ user })).id
  const data = {
    id: generateId(),
    loanId,
    date: params.date ?? Date.now(),
    newRate: params.newRate ?? 2.5,
    newPayment: params.newPayment ?? 180,
    user
  }
  sqliteDb.insert(schema.loanEvents).values(data).run()
  return data
}

export const insertSubscription = async (params: Record<string, any> = {}): Promise<any> => {
  const user = ensureUser(params.user)
  const categoryId = params.categoryId ?? (await insertCategory({ user })).id
  const accountId = params.accountId ?? (await insertAccount({ user })).id
  const data = {
    id: generateId(),
    name: params.name ?? faker.company.name(),
    amount: params.amount ?? faker.number.float({ min: 1, max: 50, multipleOf: 0.01 }),
    currency: params.currency ?? null,
    cycle: params.cycle ?? 1,
    nextPaymentDate: params.nextPaymentDate ?? null,
    categoryId,
    accountId,
    logoUrl: params.logoUrl ?? null,
    user
  }
  sqliteDb.insert(schema.subscriptions).values(data).run()
  return data
}

export const insertSubscriptionCandidate = async (params: Record<string, any> = {}): Promise<any> => {
  const user = ensureUser(params.user)
  const transactionId = params.transactionId ?? (await insertTransaction({ user })).id
  const subscriptionId = params.subscriptionId ?? (await insertSubscription({ user })).id
  const data = {
    id: generateId(),
    transactionId,
    subscriptionIds: params.subscriptionIds ?? [subscriptionId],
    createdAt: params.createdAt ?? Date.now(),
    user
  }
  sqliteDb.insert(schema.subscriptionCandidates).values(data).run()
  return data
}

export const insertDebt = async (params: Record<string, any> = {}): Promise<any> => {
  const data = {
    id: generateId(),
    from: params.from ?? faker.person.firstName(),
    date: params.date ?? new Date(faker.date.past()),
    amount: params.amount ?? faker.number.int({ min: 1, max: 5000 }),
    concept: params.concept ?? faker.lorem.words(4),
    type: params.type ?? (Math.random() > 0.5 ? DEBT.TO : DEBT.FROM),
    user: ensureUser(params.user)
  }
  sqliteDb.insert(schema.debts).values(data).run()
  return data
}

export const insertStock = async (params: Record<string, any> = {}): Promise<any> => {
  const data = {
    id: generateId(),
    platform: params.platform ?? 'DEGIRO',
    ticker: params.ticker ?? faker.string.alpha({ length: 4, casing: 'upper' }),
    name: params.name ?? faker.company.name(),
    shares: params.shares ?? faker.number.float({ min: 1, max: 100, multipleOf: 0.01 }),
    price: params.price ?? faker.number.float({ min: 1, max: 500, multipleOf: 0.01 }),
    type: params.type ?? STOCK_TYPE.Buy,
    date: params.date ?? new Date(faker.date.past()),
    user: ensureUser(params.user)
  }
  sqliteDb.insert(schema.stocks).values(data).run()
  return data
}

export const insertGoal = async (params: Record<string, any> = {}): Promise<any> => {
  const data = {
    id: generateId(),
    name: params.name ?? faker.lorem.words(2),
    targetAmount: params.targetAmount ?? faker.number.float({ min: 100, max: 10000, multipleOf: 0.01 }),
    currentAmount: params.currentAmount ?? 0,
    deadline: params.deadline ?? null,
    color: params.color ?? faker.helpers.arrayElement(GOAL_COLORS),
    icon: params.icon ?? faker.helpers.arrayElement(GOAL_ICONS),
    user: ensureUser(params.user)
  }
  sqliteDb.insert(schema.goals).values(data).run()
  return data
}

export const insertPension = async (params: Record<string, any> = {}): Promise<any> => {
  const data = {
    id: generateId(),
    date: new Date(params.date ?? faker.date.past()),
    value: params.value ?? faker.number.int(),
    companyAmount: params.companyAmount ?? faker.number.int(),
    companyUnits: params.companyUnits ?? faker.number.int(),
    employeeUnits: params.employeeUnits ?? faker.number.int(),
    employeeAmount: params.employeeAmount ?? faker.number.int(),
    user: ensureUser(params.user)
  }
  sqliteDb.insert(schema.pensions).values(data).run()
  return data
}

export const insertProperty = (params: Record<string, any> = {}) => {
  const user = ensureUser(params.user)
  return propertyRepository.create({ name: params.name ?? faker.location.streetAddress(), user })
}

export const insertSupply = (params: Record<string, any> = {}) => {
  const user = ensureUser(params.user)
  const propertyId = params.propertyId ?? insertProperty({ user }).id
  const { propertyId: _pid, user: _u, ...rest } = params
  return supplyRepository.create({
    name: faker.company.name(),
    type: SUPPLY_TYPE.ELECTRICITY,
    ...rest,
    propertyId,
    user
  } as any)
}

export const insertSupplyReading = (params: Record<string, any> = {}) => {
  const user = ensureUser(params.user)
  const supplyId = params.supplyId ?? insertSupply({ user }).id
  const startDate = params.startDate ?? faker.date.past({ years: 1 }).getTime()
  const endDate = params.endDate ?? faker.date.between({ from: startDate, to: Date.now() }).getTime()
  return supplyReadingRepository.create({
    supplyId,
    startDate,
    endDate,
    amount: params.amount ?? faker.number.float({ min: -50, max: 250, multipleOf: 0.01 }),
    consumptionPeak: params.consumptionPeak ?? faker.number.int({ min: 10, max: 100 }),
    consumptionFlat: params.consumptionFlat ?? faker.number.int({ min: 10, max: 100 }),
    consumptionOffPeak: params.consumptionOffPeak ?? faker.number.int({ min: 10, max: 100 }),
    consumption: params.consumption ?? faker.number.int({ min: 10, max: 100 }),
    user
  } as any)
}
