import isNil from 'lodash.isnil'
import isPlainObject from 'lodash.isplainobject'
import mongoose, { HydratedDocument, Types } from 'mongoose'

import mongooseConnect from './mongoose-connect'

import { IAccount, AccountModel } from './models/accounts'
import { IBudget, BudgetModel } from './models/budgets'
import { ICategory, CategoryModel } from './models/categories'
import { IDebt, DebtModel, DebtType } from './models/debts'
import { IPension, PensionModel } from './models/pensions'
import { IStore, StoreModel } from './models/stores'
import { ITransaction, TransactionModel, TransactionType } from './models/transactions'
import { IUser, UserModel } from './models/users'
import { ILoan, LoanModel } from './models/loans'
import { ILoanPayment, LoanPaymentModel, LoanPaymentType } from './models/loan-payments'
import { ILoanEvent, LoanEventModel } from './models/loan-events'

export type AccountDocument = HydratedDocument<IAccount>
export type BudgetDocument = HydratedDocument<IBudget>
export type CategoryDocument = HydratedDocument<ICategory>
export type DebtDocument = HydratedDocument<IDebt>
export type LoanDocument = HydratedDocument<ILoan>
export type LoanPaymentDocument = HydratedDocument<ILoanPayment>
export type LoanEventDocument = HydratedDocument<ILoanEvent>
export type PensionDocument = HydratedDocument<IPension>
export type StoreDocument = HydratedDocument<IStore>
export type TransactionDocument = HydratedDocument<ITransaction>
export type UserDocument = HydratedDocument<IUser>

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

  DebtType,
  LoanPaymentType,
  TransactionType,

  IAccount,
  IBudget,
  ICategory,
  IDebt,
  ILoan,
  ILoanPayment,
  ILoanEvent,
  IPension,
  IStore,
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
  TransactionModel,
  UserModel
}
