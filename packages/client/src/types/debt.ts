export enum DebtType {
    FROM = 'from',
    TO = 'to',
}

export interface Debt {
    from: string
    date: number,
    amount: number,
    paymentDate: number,
    concept: string,
    type: DebtType,
    user: string,
}
