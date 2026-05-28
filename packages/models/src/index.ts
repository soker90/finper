import isNil from 'lodash.isnil'
import isPlainObject from 'lodash.isplainobject'
import mongoose, { Types } from 'mongoose'

import mongooseConnect from './mongoose-connect'

import { IAccount, AccountModel } from './models/accounts'
import { IBudget, BudgetModel } from './models/budgets'
import { ICategory, CategoryModel } from './models/categories'

import { IStore, StoreModel } from './models/stores'
import { ITransaction, TransactionModel, TRANSACTION } from './models/transactions'

import { ILoan, LoanModel } from './models/loans'
import { ILoanPayment, LoanPaymentModel, LOAN_PAYMENT } from './models/loan-payments'
import { ILoanEvent, LoanEventModel } from './models/loan-events'
import { ISubscription, SubscriptionModel } from './models/subscriptions'
import { ISubscriptionCandidate, SubscriptionCandidateModel } from './models/subscription-candidates'
import { IProperty, PropertyModel } from './models/properties'
import { ISupply, SupplyModel, SUPPLY_TYPE } from './models/supplies'
import { ISupplyReading, SupplyReadingModel } from './models/supply-readings'


export type { AccountDocument } from './models/accounts'
export type { BudgetDocument } from './models/budgets'
export type { CategoryDocument } from './models/categories'

export type { LoanDocument } from './models/loans'
export type { LoanPaymentDocument } from './models/loan-payments'
export type { LoanEventDocument } from './models/loan-events'
export type { StoreDocument } from './models/stores'
export type { TransactionDocument } from './models/transactions'

export type { SubscriptionDocument } from './models/subscriptions'
export type { SubscriptionCandidateDocument } from './models/subscription-candidates'
export type { PropertyDocument } from './models/properties'
export type { SupplyDocument } from './models/supplies'
export type { SupplyReadingDocument } from './models/supply-readings'


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


  LOAN_PAYMENT,
  TRANSACTION,
  SUPPLY_TYPE,


  IAccount,
  IBudget,
  ICategory,
  ILoan,
  ILoanPayment,
  ILoanEvent,
  IStore,
  ISubscription,
  ISubscriptionCandidate,
  ITransaction,

  IProperty,
  ISupply,
  ISupplyReading,


  AccountModel,
  BudgetModel,
  CategoryModel,

  LoanModel,
  LoanPaymentModel,
  LoanEventModel,
  StoreModel,
  SubscriptionModel,
  SubscriptionCandidateModel,
  TransactionModel,

  PropertyModel,
  SupplyModel,
  SupplyReadingModel
}
