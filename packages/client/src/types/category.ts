import type { TransactionType, BudgetRuleClassType } from '@soker90/finper-types'

export interface Category {
  _id?: string;
  name: string,
  type: TransactionType,
  root?: boolean,
  parent?: { _id?: string, name?: string },
  budgetRuleClass?: BudgetRuleClassType,
}

export interface CategoryGrouped {
  _id: string;
  name: string,
  children: { _id: string, name: string }[],
}
