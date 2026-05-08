import useSWR from 'swr'
import { Goal } from 'types'
import { GOALS } from 'constants/api-paths'

export const useGoals = (): { goals: Goal[], isLoading: boolean, error: any } => {
  const { data, error, isLoading } = useSWR(GOALS)

  return { goals: data || [], isLoading, error }
}
