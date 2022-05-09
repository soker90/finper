// @ts-ignore
import Promise from 'bluebird'
import mongoose, { Mongoose } from 'mongoose'
import * as models from './models'
import { IAccount } from './models/account'
import mongooseConnect from './mongoose-connect'

export interface IModels {
    mongoose: Mongoose
    AccountModel: IAccount
}

class Models {
  constructor () {
    mongoose.Promise = Promise
    Object.assign(this, { mongoose }, models)
  }

  async connect (uri: string, options = null) {
    if (!mongoose) {
      throw new Error('Specify `mongoose` as the first argument')
    }

    if (!uri) {
      throw new Error('Missing an `uri` string to establish mongodb connection')
    }

    Object.assign(options, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })

    await mongooseConnect(mongoose, uri, options)

    return this
  }
}

export default new Models()
