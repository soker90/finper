import {Schema, model} from 'mongoose'

interface IAccount {
    username: string;
    password: string;
}

const accountSchema = new Schema<IAccount>({
    username: { type: String, required: true },
    password: { type: String, required: true },
}, {versionKey: false});

export default model('Account', accountSchema, 'account');