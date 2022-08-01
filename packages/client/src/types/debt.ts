export enum DebtType {
    // eslint-disable-next-line no-unused-vars
    FROM = 'from',
    // eslint-disable-next-line no-unused-vars
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
