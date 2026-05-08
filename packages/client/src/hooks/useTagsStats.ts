import useSWR from 'swr'
import { STATS_TAGS } from 'constants/api-paths'
import { TagSummary } from 'types'

export const useTagsStats = (year: number) => {
  const { data, error } = useSWR<TagSummary[]>(`${STATS_TAGS}?year=${year}`)
  return { tagStats: data ?? [], isLoading: data === undefined && !error, error }
}
