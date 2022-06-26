/* eslint-disable no-unused-vars */
export enum TransactionType {
    Expense = 'expense',
    Income = 'income',
    NotComputable = 'not_computable',
}

export interface Transaction {
    _id?: string,
    date: number,
    category: {
        _id: string,
        name: string,
    },
    amount: number,
    type: TransactionType,
    account: {
        _id: string,
        name: string,
        bank: string,
    },
    note: string,
    store?: {
        name: string,
    },
}

export interface TransactionInput {
    _id?: string,
    date: number,
    category: string,
    amount: number,
    type: TransactionType,
    account: string,
    note: string,
    store?: string,
}
