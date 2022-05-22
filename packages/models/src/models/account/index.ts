import {Schema, model, Document, Model} from 'mongoose';
import encryptPasswordPreSave from './hooks/encrypt-password-pre-save';

export interface IAccount extends Document {
    username: string
    password: string
}

const accountSchema = new Schema<IAccount>({
    username: {type: String, required: true},
    password: {type: String, required: true}
}, {versionKey: false});


accountSchema.pre<IAccount>('save', encryptPasswordPreSave);

export const AccountModel = model<IAccount>('Account', accountSchema, 'account');
