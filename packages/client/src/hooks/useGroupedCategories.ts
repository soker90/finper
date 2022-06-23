import useSWR from 'swr'
import { GROUPED_CATEGORIES } from 'constants/api-paths'
import { CategoryGrouped } from 'types'

export const useGroupedCategories = (): { categories: CategoryGrouped[], isLoading: boolean, error: any } => {
  const { data, error } = useSWR(GROUPED_CATEGORIES)

  return { categories: data || [], isLoading: !data, error }
}
