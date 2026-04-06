import useSWR from 'swr'
import { CATEGORIES } from 'constants/api-paths'
import { Category } from 'types'

export const useCategories = (): { categories: Category[], isLoading: boolean, error: any } => {
  const { data, error } = useSWR(CATEGORIES)

  return { categories: data || [], isLoading: !data, error }
}
