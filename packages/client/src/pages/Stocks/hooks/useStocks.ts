import useSWR, { useSWRConfig } from 'swr'
import { STOCKS } from 'constants/api-paths'
import { StockPosition, StockPurchase } from 'types'
import { addStockApi, deleteStockApi } from 'services/apiService'

export const useStocks = (): {
  error: any
  isLoading: boolean
  positions: StockPosition[]
  addStock: (stock: Omit<StockPurchase, '_id'>) => Promise<{ error?: string }>
  deleteStock: (id: string) => Promise<{ error?: string }>
} => {
  const { data, error } = useSWR<StockPosition[]>(STOCKS)
  const { mutate } = useSWRConfig()

  const addStock = async (stock: Omit<StockPurchase, '_id'>) => {
    const result = await addStockApi(stock)
    if (!result.error) {
      await mutate(STOCKS)
    }
    return result
  }

  const deleteStock = async (id: string) => {
    const result = await deleteStockApi(id)
    if (!result.error) {
      await mutate(STOCKS)
    }
    return result
  }

  return {
    positions: data ?? [],
    isLoading: !data && !error,
    error,
    addStock,
    deleteStock
  }
}
