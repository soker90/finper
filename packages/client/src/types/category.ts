import type { TransactionType, BudgetRuleClassType, CategoryColor, CategoryIcon } from '@soker90/finper-types'

export interface Category {
  _id?: string;
  name: string,
  type: TransactionType,
  root?: boolean,
  parent?: { _id?: string, name?: string },
  budgetRuleClass?: BudgetRuleClassType,
  color?: CategoryColor,
  icon?: CategoryIcon,
}

export interface CategoryGrouped {
  _id: string;
  name: string,
  children: { _id: string, name: string }[],
}
