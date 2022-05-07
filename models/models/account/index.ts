import { Schema, model } from 'mongoose';
import encryptPasswordPreSave from './hooks/encrypt-password-pre-save';

const accountSchema = new Schema({
  username: String,
  password: String,
}, { versionKey: false });

accountSchema.pre('save', encryptPasswordPreSave);

export default model('Account', accountSchema, 'account');
