export const BUDGET_RULE_CLASS = {
  Needs: 'needs',
  Wants: 'wants',
  Savings: 'savings',
  None: 'none',
} as const

export type BudgetRuleClassType = typeof BUDGET_RULE_CLASS[keyof typeof BUDGET_RULE_CLASS]
