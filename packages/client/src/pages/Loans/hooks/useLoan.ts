import useSWR from 'swr'
import { LOAN_DETAIL } from 'constants/api-paths'
import { LoanDetail } from 'types'

export const useLoan = (id: string): {
  loan: LoanDetail | undefined
  isLoading: boolean
  error: any
} => {
  const { data, error } = useSWR(id ? LOAN_DETAIL(id) : null)

  return {
    loan: data,
    isLoading: !data && !error,
    error
  }
}
