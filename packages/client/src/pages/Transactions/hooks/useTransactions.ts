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
}: UseTransactions): { transactions: Transaction[], isLoading: boolean, error: any } => {
  const { data, error } = useSWR(`${TRANSACTIONS}${objectToParams({ page: index, ...filters })}`)

  return { transactions: data, isLoading: !data, error }
}
