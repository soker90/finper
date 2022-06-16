import { TransactionType } from './transaction'

export interface Category {
    _id?: string;
    name: string,
    type: TransactionType,
    root?: boolean,
}
