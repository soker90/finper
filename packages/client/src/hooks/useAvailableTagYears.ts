import useSWR from 'swr'
import { STATS_TAGS_YEARS } from 'constants/api-paths'

export const useAvailableTagYears = () => {
  const { data, error } = useSWR<number[]>(STATS_TAGS_YEARS)
  return { years: data ?? [], isLoading: data === undefined && !error, error }
}
