import useSWR from 'swr'
import { TRANSACTIONS } from 'constants/api-paths'
import { Transaction } from 'types'
import { objectToParams } from 'utils/objectToParams'

interface UseTransactions {
    index: number,
    filters: any,
}

export const useTransactions = ({
  index,
  filters
}: UseTransactions): { transactions: Transaction[], isLoading: boolean, error: any, query: string } => {
  const query = `${TRANSACTIONS}${objectToParams({ page: index, ...filters })}`
  const { data, error } = useSWR(query)

  return { transactions: data, isLoading: !data, error, query }
}
