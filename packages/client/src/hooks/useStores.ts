import useSWR from 'swr'
import { Store } from 'types'
import { STORES } from 'constants/api-paths'

export const useStores = (): { stores: Store[], isLoading: boolean, error: any } => {
  const { data, error } = useSWR(STORES)

  return { stores: data || [], isLoading: !data, error }
}
