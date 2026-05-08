import useSWR from 'swr'
import { STATS_TAGS_BY_YEAR } from 'constants/api-paths'
import { TagSummary } from 'types'

export const useTagsStats = (year: number | null) => {
  const { data, error, isLoading } = useSWR<TagSummary[]>(year ? STATS_TAGS_BY_YEAR(year) : null)
  return { tagStats: data ?? [], isLoading, error }
}
