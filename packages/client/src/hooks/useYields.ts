import useSWR, { useSWRConfig } from 'swr'
import { Yield, YieldInput, YieldDetail } from 'types'
import { YIELDS, YIELD_DETAIL } from 'constants/api-paths'
import { addYield, editYield, deleteYield, unlinkYieldTransaction, deleteYieldSettlement } from 'services/apiService'

export const useYields = (): {
  yields: Yield[]
  isLoading: boolean
  error: any
  createYield: (params: YieldInput) => Promise<{ error?: string, existingYieldId?: string }>
  updateYield: (id: string, params: Partial<YieldInput>) => Promise<{ error?: string, existingYieldId?: string }>
  removeYield: (id: string) => Promise<{ error?: string }>
} => {
  const { data, error, mutate, isLoading } = useSWR<Yield[]>(YIELDS)

  const createYield = async (params: YieldInput) => {
    const result = await addYield(params)
    if (!result.error) {
      await mutate()
    }
    return result
  }

  const updateYield = async (id: string, params: Partial<YieldInput>) => {
    const result = await editYield(id, params)
    if (!result.error) {
      await mutate()
    }
    return result
  }

  const removeYield = async (id: string) => {
    const result = await deleteYield(id)
    if (!result.error) {
      await mutate(
        (current) => current?.filter((y) => y._id !== id),
        { revalidate: false }
      )
    }
    return result
  }

  return {
    yields: data ?? [],
    isLoading,
    error,
    createYield,
    updateYield,
    removeYield
  }
}

export const useYield = (id?: string): {
  yieldData: YieldDetail | null
  isLoading: boolean
  error: any
  mutate: () => Promise<any>
} => {
  const { data, error, mutate: mutateYield, isLoading } = useSWR<YieldDetail>(id ? YIELD_DETAIL(id) : null)
  return {
    yieldData: data ?? null,
    isLoading,
    error,
    mutate: mutateYield
  }
}

/** Unlinks a transaction from a yield, refreshes both caches and reports the result. */
export const useUnlinkYieldTransaction = (): (yieldId: string, transactionId: string) => Promise<{ error?: string }> => {
  const { mutate } = useSWRConfig()

  return async (yieldId: string, transactionId: string) => {
    const result = await unlinkYieldTransaction(yieldId, transactionId)
    if (result.error) return result
    await mutate(YIELDS)
    await mutate(YIELD_DETAIL(yieldId))
    return result
  }
}

/** Unlinks every transaction of a settlement and deletes it, then refreshes both caches. */
export const useDeleteYieldSettlement = (): (yieldId: string, settlementId: string) => Promise<{ error?: string }> => {
  const { mutate } = useSWRConfig()

  return async (yieldId: string, settlementId: string) => {
    const result = await deleteYieldSettlement(yieldId, settlementId)
    if (result.error) return result
    await mutate(YIELDS)
    await mutate(YIELD_DETAIL(yieldId))
    return result
  }
}
