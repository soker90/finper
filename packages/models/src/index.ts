import isNil from 'lodash.isnil'
import isPlainObject from 'lodash.isplainobject'
import Promise from 'bluebird'
import mongoose from 'mongoose'

import mongooseConnect from './mongoose-connect'

import { IAccount, AccountModel } from './models/accounts'
import { IBudget, BudgetModel } from './models/budgets'
import { ICategory, CategoryModel } from './models/categories'
import { IDebt, DebtModel, DebtType } from './models/debts'
import { ILoan, LoanModel } from './models/loans'
import { ILoanHistory, LoanHistoryType, LoanHistoryModel } from './models/loans-history'
import { IStore, StoreModel } from './models/stores'
import { ITransaction, TransactionModel, TransactionType } from './models/transactions'
import { IUser, UserModel } from './models/users'

mongoose.Promise = Promise

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

  DebtType,
  LoanHistoryType,
  TransactionType,

  IAccount,
  IBudget,
  ICategory,
  IDebt,
  ILoan,
  ILoanHistory,
  IStore,
  ITransaction,
  IUser,

  AccountModel,
  BudgetModel,
  CategoryModel,
  DebtModel,
  LoanModel,
  LoanHistoryModel,
  StoreModel,
  TransactionModel,
  UserModel

}
