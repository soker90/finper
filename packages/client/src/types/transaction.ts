/* eslint-disable no-unused-vars */
export enum TransactionType {
    Expense = 'expense',
    Income = 'income',
    NotComputable = 'not_computable',
}

export interface Transaction {
    _id?: string,
    date: number,
    category: string,
    amount: number,
    type: TransactionType,
    account: {
        name: string,
        bank: string,
    },
    note: string,
    store?: string,
}
