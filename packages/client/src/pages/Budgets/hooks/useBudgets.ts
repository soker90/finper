import { useMemo } from 'react'
import useSWR from 'swr'
import { BUDGETS } from 'constants/api-paths'
import { objectToParams } from 'utils/objectToParams'
import { TransactionType } from 'types/transaction'
import { BudgetItem } from 'types/budget'

const INITIAL_BUDGET = {
  expenses: [],
  incomes: []
}
export const useBudgets = (filters: { year?: string, month?: string }): {
    expenses: BudgetItem[], incomes: BudgetItem[], isLoading: boolean, error: any,
} => {
  const { data, error } = useSWR(`${BUDGETS}${objectToParams(filters)}`)

  const budgetsFiltered = useMemo(() => data
    ? {
        expenses: data?.[0]?.budget?.filter((budget: BudgetItem) => budget.category.type === TransactionType.Expense) || [],
        incomes: data?.[0]?.budget?.filter((budget: BudgetItem) => budget.category.type === TransactionType.Income) || []
      }
    : INITIAL_BUDGET, [data])

  return {
    isLoading: !data,
    error,
    ...budgetsFiltered
  }
}
