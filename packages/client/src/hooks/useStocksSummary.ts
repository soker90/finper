import useSWR from 'swr'
import { STOCKS_SUMMARY } from 'constants/api-paths'

export interface StocksSummary {
  totalCost: number
  totalValue: number | null
}

export const useStocksSummary = (): {
  summary: StocksSummary | null
  isLoading: boolean
  error: any
} => {
  const { data, error, isLoading } = useSWR<StocksSummary>(STOCKS_SUMMARY)

  return {
    summary: data ?? null,
    isLoading,
    error
  }
}
