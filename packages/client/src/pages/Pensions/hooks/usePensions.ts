import useSWR from 'swr'
import { PENSIONS } from 'constants/api-paths'
import { Pension } from 'types'

export const usePensions = (): {
  error: any,
  isLoading: boolean,
  pension?: Pension,
  addPension: (pension: Pension) => void,
  editPension: (id: string, pension: Pension) => void,
} => {
  const { data, error } = useSWR<Pension>(PENSIONS)

  const addPension = (pension: Pension) => {

  }
  const editPension = (id: string, pension: Pension) => {
    //
  }

  return {
    pension: data,
    isLoading: !data && !error,
    error,
    addPension,
    editPension
  }
}
