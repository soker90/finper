export interface BudgetItem {
    amount: number,
    real: number,
    budgetId: string,
}

export interface Budget {
    _id: string,
    name: string;
    budget: BudgetItem[];
}
