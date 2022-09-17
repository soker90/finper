import useSWR from 'swr'
import { BUDGETS } from 'constants/api-paths'
import { objectToParams } from 'utils/objectToParams'
import { Budget } from 'types/budget'

export const useBudgets = (filters: { year?: string, month?: string }): {
    expenses: Budget[], incomes: Budget[], isLoading: boolean, error: any, totalsIncomes: Budget, totalsExpenses: Budget
} => {
  const { data, error } = useSWR(`${BUDGETS}${objectToParams(filters)}`)

  return {
    isLoading: !data,
    error,
    incomes: data?.incomes?.filter?.(({ id }: Budget) => id !== 'totals') || [],
    expenses: data?.expenses?.filter?.(({ id }: Budget) => id !== 'totals') || [],
    totalsIncomes: data?.incomes?.find?.(({ id }: Budget) => id === 'totals') || {},
    totalsExpenses: data?.expenses?.find?.(({ id }: Budget) => id === 'totals') || {}
  }
}
