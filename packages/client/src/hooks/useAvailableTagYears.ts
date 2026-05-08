import useSWR from 'swr'
import { STATS_TAGS_YEARS } from 'constants/api-paths'

export const useAvailableTagYears = () => {
  const { data, error, isLoading } = useSWR<number[]>(STATS_TAGS_YEARS)
  return { years: data ?? [], isLoading, error }
}
