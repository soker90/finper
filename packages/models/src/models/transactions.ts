import {Schema, model, Document} from 'mongoose';

export enum TransactionType {
    Expense = 'expense',
    Income = 'income',
    NotComputable = 'not_computable',
}

export interface ITransaction extends Document {
    date: number,
    category: string,
    categoryId: string,
    amount: number,
    type: TransactionType,
    account: string,
    accountId: string,
    bank: string,
    note: string,
    storeId?: string,
    store?: string,
}

const transactionSchema = new Schema<ITransaction>({
    date: {type: Number, required: true},
    category: {type: String, required: true},
    categoryId: {type: String, required: true},
    amount: {type: Number, required: true},
    bank: {type: String, required: true},
    type: {type: String, required: true},
    account: {type: String, required: true},
    accountId: {type: String, required: true},
    note: {type: String},
    storeId: {type: String},
    store: {type: String},
}, {versionKey: false});


export const TransactionModel = model<ITransaction>('Transaction', transactionSchema);
