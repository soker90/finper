import useSWR from 'swr'
import { CATEGORIES } from 'constants/api-paths'
import { Category } from 'types'

export const useCategories = (): { categories: Category[], isLoading: boolean, error: any } => {
  const { data, error, isLoading } = useSWR(CATEGORIES)

  return { categories: data || [], isLoading, error }
}
