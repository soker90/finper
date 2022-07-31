import useSWR from 'swr'
import { DEBTS } from 'constants/api-paths'
import { Debt } from 'types'

export const useDebts = (): { debts: Debt[], isLoading: boolean, error: any } => {
  const { data, error } = useSWR(DEBTS)

  return { debts: data || [], isLoading: !data, error }
}
