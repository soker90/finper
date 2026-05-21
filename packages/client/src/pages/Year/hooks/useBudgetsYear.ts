import useSWR from 'swr'
import { BUDGETS } from 'constants/api-paths'
import { objectToParams } from 'utils/objectToParams'
import { Budget } from 'types/budget'

export const useBudgetsYear = (filters: { year?: string }): {
  expenses: Budget[], incomes: Budget[], isLoading: boolean, error: any,
} => {
  const { data, error, isLoading } = useSWR(`${BUDGETS}${objectToParams(filters)}`)

  return {
    isLoading,
    error,
    incomes: data?.incomes || [],
    expenses: data?.expenses || []
  }
}
