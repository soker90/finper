import { TransactionType } from './transaction'

export interface Category {
    name: string,
    type: TransactionType,
    root?: boolean,
}
