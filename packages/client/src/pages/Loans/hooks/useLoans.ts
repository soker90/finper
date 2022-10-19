import useSWR from 'swr'
import { LOANS } from 'constants/api-paths'
import { Debt } from 'types'

export const useLoans = (): {
    from: Debt[], to: Debt[], isLoading: boolean, error: any,
    debtsByPerson: { _id: string, total: number }[]
} => {
  const { data, error } = useSWR(LOANS)

  return {
    from: data?.from || [],
    to: data?.to || [],
    debtsByPerson: data?.debtsByPerson || [],
    isLoading: !data,
    error
  }
}
