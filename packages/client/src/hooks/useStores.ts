import useSWR from 'swr'
import { Store } from 'types'
import { STORES } from 'constants/api-paths'

export const useStores = (): { stores: Store[], isLoading: boolean, error: any } => {
  const { data, error, isLoading } = useSWR(STORES)

  return { stores: data || [], isLoading, error }
}
