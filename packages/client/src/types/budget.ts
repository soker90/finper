import { Category } from 'types/category'

export interface BudgetItem {
    _id: string,
    category: Category,
    amount: number,
}

export interface Budget {
    month: number;
    budget: BudgetItem[];
}
