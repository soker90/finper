import useSWR from 'swr'
import { STATS_TAG_HISTORIC } from 'constants/api-paths'
import { TagHistoric } from 'types'

export const useTagHistoric = (tagName: string) => {
  const { data, error } = useSWR<TagHistoric>(tagName ? STATS_TAG_HISTORIC(tagName) : null)
  return { tagHistoric: data ?? null, isLoading: data === undefined && !error, error }
}
