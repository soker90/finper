import {Schema, model, Document, Model} from 'mongoose';
import encryptPasswordPreSave from './hooks/encrypt-password-pre-save';

export interface IAccount extends Document {
    username: string
    password: string
}

interface IAccountModel extends Model<IAccount> {
}


const accountSchema = new Schema<IAccount, IAccountModel>({
    username: {type: String, required: true},
    password: {type: String, required: true}
}, {versionKey: false});


accountSchema.pre<IAccount>('save', encryptPasswordPreSave);

export const AccountModel = model<IAccount>('Account', accountSchema, 'account');
