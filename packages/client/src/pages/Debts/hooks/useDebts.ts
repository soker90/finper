import useSWR from 'swr'
import { DEBTS } from 'constants/api-paths'
import { Debt } from 'types'

export const useDebts = (): {
    from: Debt[], to: Debt[], isLoading: boolean, error: any,
    debtsByPerson: { _id: string, total: number }[]
} => {
  const { data, error } = useSWR(DEBTS)

  return {
    from: data?.from || [],
    to: data?.to || [],
    debtsByPerson: data?.debtsByPerson || [],
    isLoading: !data,
    error
  }
}
