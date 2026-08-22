export interface PensionTransaction {
  _id?: string;
  planId?: string;
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

export interface PensionPlan {
  _id: string;
  id: string;
  name: string;
  color?: string;
  amount: number;
  units: number;
  employeeAmount: number;
  companyAmount: number;
  total: number;
  user?: string;
}
