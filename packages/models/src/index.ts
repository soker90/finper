import isNil from 'lodash.isnil'
import isPlainObject from 'lodash.isplainobject'
import mongoose, { HydratedDocument } from 'mongoose'

import mongooseConnect from './mongoose-connect'

import { IAccount, AccountModel } from './models/accounts'
import { IBudget, BudgetModel } from './models/budgets'
import { ICategory, CategoryModel } from './models/categories'
import { IDebt, DebtModel, DebtType } from './models/debts'
import { IPension, PensionModel } from './models/pensions'
import { IStore, StoreModel } from './models/stores'
import { ITransaction, TransactionModel, TransactionType } from './models/transactions'
import { IUser, UserModel } from './models/users'

export type AccountDocument = HydratedDocument<IAccount>
export type BudgetDocument = HydratedDocument<IBudget>
export type CategoryDocument = HydratedDocument<ICategory>
export type DebtDocument = HydratedDocument<IDebt>
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

  DebtType,
  TransactionType,

  IAccount,
  IBudget,
  ICategory,
  IDebt,
  IPension,
  IStore,
  ITransaction,
  IUser,

  AccountModel,
  BudgetModel,
  CategoryModel,
  DebtModel,
  PensionModel,
  StoreModel,
  TransactionModel,
  UserModel
}
