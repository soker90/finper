import useSWR from 'swr'
import { BUDGETS } from 'constants/api-paths'
import { objectToParams } from 'utils/objectToParams'
import { Budget } from 'types/budget'

export const useBudgets = (filters: { year?: string, month?: string }): {
    expenses: Budget[], incomes: Budget[], isLoading: boolean, error: any,
} => {
  const { data, error } = useSWR(`${BUDGETS}${objectToParams(filters)}`)

  return {
    isLoading: !data,
    error,
    incomes: data?.incomes || [],
    expenses: data?.expenses || []
  }
}
