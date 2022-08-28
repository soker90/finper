export interface BudgetItem {
    amount: number,
    real: number,
    month: number,
    year: number
}

export interface Budget {
    id: string,
    name: string;
    budgets: BudgetItem[];
}
