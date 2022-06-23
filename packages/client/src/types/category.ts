import { TransactionType } from './transaction'

export interface Category {
    _id?: string;
    name: string,
    type: TransactionType,
    root?: boolean,
    parent?: { _id?: string, name?: string },
}

export interface CategoryGrouped {
    _id: string;
    name: string,
    children: { _id: string, name: string }[],
}
