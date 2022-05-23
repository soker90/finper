import {Schema, model, Document} from 'mongoose';

export enum TransactionType {
    Expense = 'expense',
    Income = 'income',
    NotComputable = 'not_computable',
}

export interface ITransaction extends Document {
    date: number,
    category: string,
    shop: string,
    amount: number,
    type: TransactionType,
    account: string,
    note: string,
}

const transactionSchema = new Schema<ITransaction>({
    date: {type: Number, required: true},
    category: {type: String, required: true},
    shop: {type: String},
    amount: {type: Number, required: true},
    type: {type: String, required: true},
    account: {type: String, required: true},
    note: {type: String},
}, {versionKey: false});


export const TransactionModel = model<ITransaction>('Transaction', transactionSchema);
