import useSWR from 'swr'
import { STATS_TAGS_AVAILABLE } from 'constants/api-paths'

export const useAvailableTags = () => {
  const { data, error } = useSWR<string[]>(STATS_TAGS_AVAILABLE)
  return { tags: data ?? [], isLoading: data === undefined && !error, error }
}
