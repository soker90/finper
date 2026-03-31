import useSWR from 'swr'
import { LOAN_DETAIL } from 'constants/api-paths'
import { LoanDetail } from 'types'

export const useLoan = (id: string): {
  loan: LoanDetail | undefined
  isLoading: boolean
  error: Error | undefined
} => {
  const { data, error, isLoading } = useSWR<LoanDetail>(id ? LOAN_DETAIL(id) : null)

  return {
    loan: data,
    isLoading,
    error: error as Error | undefined
  }
}
