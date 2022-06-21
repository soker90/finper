import useSWR from 'swr'
import { TRANSACTIONS } from 'constants/api-paths'
import { Transaction } from 'types'

export const useTransactions = (index: number): { transactions: Transaction[], isLoading: boolean, error: any } => {
  const { data, error } = useSWR(`${TRANSACTIONS}?page=${index}`)

  return { transactions: data, isLoading: !data, error }
}
