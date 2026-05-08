import useSWR from 'swr'
import { STATS_TAG_YEAR_DETAIL } from 'constants/api-paths'
import { TagDetail } from 'types'

export const useTagDetail = (tagName: string, year: number | null) => {
  const key = tagName && year ? STATS_TAG_YEAR_DETAIL(tagName, year) : null
  const { data, error } = useSWR<TagDetail>(key)
  return { tagDetail: data ?? null, isLoading: data === undefined && !error, error }
}
