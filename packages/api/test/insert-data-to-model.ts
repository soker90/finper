import { faker } from '@faker-js/faker'
import {
  AccountModel,
  BudgetModel,
  CategoryModel, DebtModel, DebtType,
  IAccount, ICategory,
  IDebt, ILoan, ILoanPayment, IPension, IStore, ISubscription, ISubscriptionCandidate,
  IUser, LoanModel, LoanPaymentModel, LOAN_PAYMENT, PensionModel, StoreModel,
  SubscriptionCandidateModel, SubscriptionCycle, SubscriptionModel, TransactionModel,
  TRANSACTION,
  UserModel
} from '@soker90/finper-models'

import {
  MAX_USERNAME_LENGTH, MIN_LENGTH_USERNAME,
  MIN_PASSWORD_LENGTH
} from '../src/config/inputs'
import { generateUsername } from './generate-values'
import { buildAmortizationTable } from '../src/services/utils/calcLoanProjection'
import { roundNumber } from '../src/utils/roundNumber'

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

export const insertAccount = async (params: { name?: string, bank?: string, balance?: number, isActive?: boolean, user?: string } = {}): Promise<IAccount & { _id: string }> => {
  return AccountModel.create({
    name: params.name ?? faker.finance.accountName(),
    bank: params.bank ?? faker.lorem.word(),
    balance: params.balance ?? faker.number.int(),
    isActive: params.isActive ?? faker.datatype.boolean(),
    user: params.user ?? faker.internet.userName().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  }) as unknown as IAccount & { _id: string }
}

export const insertCategory = async (params: Record<string, any> = {}): Promise<ICategory & { _id: string }> => {
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
    type: params.type ?? (Math.random() > 0.5 ? TRANSACTION.Expense : TRANSACTION.Income),
    ...(parent && { parent }),
    user
  })

  return category.populate('parent') as unknown as ICategory & { _id: string }
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
    type: params.type ?? (Math.random() > 0.5 ? TRANSACTION.Expense : TRANSACTION.Income),
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

export const insertLoan = async (params: Record<string, any> = {}): Promise<ILoan & { _id: string }> => {
  const user = (params.user ?? generateUsername()) as string
  const account = params.account ?? (await insertAccount({ user }))._id
  const category = params.category ?? (await insertCategory({ user, type: TRANSACTION.Expense }))._id
  const initialAmount = params.initialAmount ?? 10000
  const interestRate = params.interestRate ?? 3
  const monthlyPayment = params.monthlyPayment ?? 200
  const startDate = params.startDate ?? Date.now()

  // Calculate initialEstimatedCost dynamically from the amortization table
  const initialProjection = buildAmortizationTable([], initialAmount, interestRate, monthlyPayment, [], startDate)
  const calculatedEstimatedCost = roundNumber(initialProjection.reduce((s, r) => s + r.amount, 0))

  return LoanModel.create({
    name: params.name ?? faker.lorem.words(2),
    initialAmount,
    pendingAmount: params.pendingAmount ?? initialAmount,
    interestRate,
    startDate,
    monthlyPayment,
    initialEstimatedCost: params.initialEstimatedCost ?? calculatedEstimatedCost,
    account,
    category,
    user
  }) as unknown as ILoan & { _id: string }
}

export const insertLoanPayment = async (params: Record<string, any> = {}): Promise<ILoanPayment & { _id: string }> => {
  const user = (params.user ?? generateUsername()) as string
  const loan = params.loan ?? (await insertLoan({ user }))._id
  const principal = params.principal ?? 175
  const accumulatedPrincipal = params.accumulatedPrincipal ?? principal
  // pendingCapital = initialAmount(10000) - accumulatedPrincipal, consistent with the defaults
  const pendingCapital = params.pendingCapital ?? roundNumber(10000 - accumulatedPrincipal)

  return LoanPaymentModel.create({
    loan,
    date: params.date ?? Date.now(),
    amount: params.amount ?? 200,
    interest: params.interest ?? 25,
    principal,
    accumulatedPrincipal,
    pendingCapital,
    type: params.type ?? LOAN_PAYMENT.ORDINARY,
    user
  }) as unknown as ILoanPayment & { _id: string }
}

export const insertSubscription = async (params: Record<string, any> = {}): Promise<ISubscription & { _id: any }> => {
  const user = (params.user ?? generateUsername()) as string
  const account = params.accountId ? { _id: params.accountId } : await insertAccount({ user })
  const category = params.categoryId ? { _id: params.categoryId } : await insertCategory({ user })

  return SubscriptionModel.create({
    name: params.name ?? faker.company.name(),
    amount: params.amount ?? faker.number.float({ min: 1, max: 50, multipleOf: 0.01 }),
    cycle: params.cycle ?? SubscriptionCycle.MONTHLY,
    categoryId: category._id,
    accountId: account._id,
    nextPaymentDate: params.nextPaymentDate ?? null,
    user
  }) as unknown as ISubscription & { _id: any }
}

export const insertSubscriptionCandidate = async (params: Record<string, any> = {}): Promise<ISubscriptionCandidate & { _id: any }> => {
  const user = (params.user ?? generateUsername()) as string
  const transaction = params.transactionId
    ? { _id: params.transactionId }
    : await insertTransaction({ user })
  const subscription = params.subscriptionId
    ? { _id: params.subscriptionId }
    : await insertSubscription({ user })

  return SubscriptionCandidateModel.create({
    transactionId: transaction._id,
    subscriptionIds: [subscription._id],
    user
  }) as unknown as ISubscriptionCandidate & { _id: any }
}
