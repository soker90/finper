import {Schema, model, Document} from 'mongoose';

export interface IBank extends Document {
    name: string
}

const bankSchema = new Schema<IBank>({
    name: {type: String, required: true},
}, {versionKey: false});


export const BankModel = model<IBank>('Bank', bankSchema);
