import { Category } from 'types/category'

export enum DebtType {
    // eslint-disable-next-line no-unused-vars
    FROM = 'from',
    // eslint-disable-next-line no-unused-vars
    TO = 'to',
}

export interface BudgetItem {
    _id: string,
    category: Category,
    amount: number,
}

export interface Budget {
    month: number;
    budget: BudgetItem[];
}
