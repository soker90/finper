import useSWR from 'swr'
import { LOANS } from 'constants/api-paths'
import { Loan } from 'types'

export const useLoans = (): {
  loans: Loan[]
  isLoading: boolean
  error: any
} => {
  const { data, error } = useSWR(LOANS)

  return {
    loans: data || [],
    isLoading: !data && !error,
    error
  }
}
