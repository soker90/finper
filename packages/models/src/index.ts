import _ from 'lodash';
import Promise from 'bluebird';
import mongoose from 'mongoose';

import { AccountModel, IAccount } from './models/account';
import mongooseConnect from './mongoose-connect';

mongoose.Promise = Promise;

export function connect(uri: string, options: Record<string, unknown>): void {
  if (_.isNil(mongoose)) {
    throw new Error('Specify `mongoose` as the first argument');
  }
  if (_.isNil(uri) || !uri) {
    throw new Error('Missing an `uri` string to establish mongodb connection');
  }
  if (!_.isNil(options) && !_.isPlainObject(options)) {
    throw new Error('The `options` argument must be an object');
  }

  mongooseConnect(mongoose, uri, options);
}

export {
  IAccount,
  AccountModel,
  mongoose,
};
