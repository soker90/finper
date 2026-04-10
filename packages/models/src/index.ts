import isNil from 'lodash.isnil'
import isPlainObject from 'lodash.isplainobject'
import mongoose, { Types } from 'mongoose'

import mongooseConnect from './mongoose-connect'

import { IAccount, AccountModel } from './models/accounts'
import { IBudget, BudgetModel } from './models/budgets'
import { ICategory, CategoryModel } from './models/categories'
import { IDebt, DebtModel, DebtType, DEBT } from './models/debts'
import { IPension, PensionModel } from './models/pensions'
import { IStore, StoreModel } from './models/stores'
import { ITransaction, TransactionModel, TransactionType, TRANSACTION } from './models/transactions'
import { IUser, UserModel } from './models/users'
import { ILoan, LoanModel } from './models/loans'
import { ILoanPayment, LoanPaymentModel, LoanPaymentType, LOAN_PAYMENT } from './models/loan-payments'
import { ILoanEvent, LoanEventModel } from './models/loan-events'
import { ISubscription, SubscriptionModel, SubscriptionCycle, SUBSCRIPTION_CYCLE } from './models/subscriptions'
import { ISubscriptionCandidate, SubscriptionCandidateModel } from './models/subscription-candidates'

export type { AccountDocument } from './models/accounts'
export type { BudgetDocument } from './models/budgets'
export type { CategoryDocument } from './models/categories'
export type { DebtDocument } from './models/debts'
export type { LoanDocument } from './models/loans'
export type { LoanPaymentDocument } from './models/loan-payments'
export type { LoanEventDocument } from './models/loan-events'
export type { PensionDocument } from './models/pensions'
export type { StoreDocument } from './models/stores'
export type { TransactionDocument } from './models/transactions'
export type { UserDocument } from './models/users'
export type { SubscriptionDocument } from './models/subscriptions'
export type { SubscriptionCandidateDocument } from './models/subscription-candidates'

function connect (uri: string, options: Record<string, unknown>): void {
  if (isNil(mongoose)) {
    throw new Error('Specify `mongoose` as the first argument')
  }
  if (isNil(uri) || !uri) {
    throw new Error('Missing an `uri` string to establish mongodb connection')
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error('The `options` argument must be an object')
  }

  mongooseConnect(mongoose, uri, options)
}

export default {
  connect
}

export {
  mongoose,
  Types,

  DEBT,
  DebtType,
  LOAN_PAYMENT,
  LoanPaymentType,
  TRANSACTION,
  TransactionType,
  SUBSCRIPTION_CYCLE,
  SubscriptionCycle,

  IAccount,
  IBudget,
  ICategory,
  IDebt,
  ILoan,
  ILoanPayment,
  ILoanEvent,
  IPension,
  IStore,
  ISubscription,
  ISubscriptionCandidate,
  ITransaction,
  IUser,

  AccountModel,
  BudgetModel,
  CategoryModel,
  DebtModel,
  LoanModel,
  LoanPaymentModel,
  LoanEventModel,
  PensionModel,
  StoreModel,
  SubscriptionModel,
  SubscriptionCandidateModel,
  TransactionModel,
  UserModel
}
