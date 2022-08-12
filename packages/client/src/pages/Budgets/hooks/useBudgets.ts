import useSWR from 'swr'
import { BUDGETS } from 'constants/api-paths'
import { objectToParams } from 'utils/objectToParams'

export const useBudgets = (filters: { year?: string, month?: string }): {
    budgets: any[], isLoading: boolean, error: any,
} => {
  const { data, error } = useSWR(`${BUDGETS}${objectToParams(filters)}`)

  return {
    budgets: data || [],
    isLoading: !data,
    error
  }
}
