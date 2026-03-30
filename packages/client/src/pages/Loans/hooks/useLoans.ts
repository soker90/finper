import useSWR from 'swr'
import { LOANS } from 'constants/api-paths'
import { Loan } from 'types'

export const useLoans = (): {
  loans: Loan[]
  isLoading: boolean
  error: Error | undefined
} => {
  const { data, error, isLoading } = useSWR<Loan[]>(LOANS)

  return {
    loans: data ?? [],
    isLoading,
    error: error as Error | undefined
  }
}
