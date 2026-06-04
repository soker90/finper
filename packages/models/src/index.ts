import isNil from 'lodash.isnil'
import isPlainObject from 'lodash.isplainobject'
import mongoose, { Types } from 'mongoose'

import mongooseConnect from './mongoose-connect'

// Constantes y tipos del antiguo core (desacoplados de los modelos Mongoose, ya eliminados)
import { TRANSACTION, ITransaction, LOAN_PAYMENT, ILoanPayment } from './core-types'

// Modelos no-core (siguen sobre Mongoose)
import { IProperty, PropertyModel } from './models/properties'
import { ISupply, SupplyModel, SUPPLY_TYPE } from './models/supplies'
import { ISupplyReading, SupplyReadingModel } from './models/supply-readings'

export type { TransactionDocument } from './core-types'
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

  TRANSACTION,
  LOAN_PAYMENT,
  SUPPLY_TYPE,

  ITransaction,
  ILoanPayment,

  IProperty,
  ISupply,
  ISupplyReading,

  PropertyModel,
  SupplyModel,
  SupplyReadingModel
}
