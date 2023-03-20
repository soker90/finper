export interface PensionTransaction {
    _id?: String;
    date: number;
    employeeAmount: number;
    employeeUnits: number;
    companyAmount: number;
    companyUnits: number;
    value: number;
}

export interface Pension {
    amount: number;
    units: number;
    employeeAmount: number;
    companyAmount: number;
    transactions: PensionTransaction[];
    total: number;
}
