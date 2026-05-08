import useSWR from 'swr'
import { WEALTH_FIRE_PROJECTION } from 'constants/api-paths'
import { type FireProjectionParams, type FireProjectionResult } from 'types/wealth'

interface UseFireProjectionReturn {
  projection: FireProjectionResult | null
  loading: boolean
  error: any
}

export const useFireProjection = (params: FireProjectionParams): UseFireProjectionReturn => {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  ).toString()

  const { data, error } = useSWR<FireProjectionResult>(WEALTH_FIRE_PROJECTION(queryString))

  return {
    projection: data ?? null,
    loading: data === undefined && !error,
    error
  }
}
