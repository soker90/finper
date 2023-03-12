import useSWR from 'swr'
import { PENSIONS } from 'constants/api-paths'
import { Pension } from 'types'

export const usePensions = (): {
    error: any,
    pension?: Pension
} => {
  const { data, error } = useSWR<Pension>(PENSIONS)

  return {
    pension: data,
    error
  }
}
