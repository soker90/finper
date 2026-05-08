import useSWR from 'swr'
import { STATS_TAGS_BY_YEAR } from 'constants/api-paths'
import { TagSummary } from 'types'

export const useTagsStats = (year: number | null) => {
  const { data, error } = useSWR<TagSummary[]>(year ? STATS_TAGS_BY_YEAR(year) : null)
  return { tagStats: data ?? [], isLoading: data === undefined && !error, error }
}
