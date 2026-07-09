import useSWR from 'swr'
import { Yield, YieldInput } from 'types'
import { YIELDS } from 'constants/api-paths'
import { addYield, editYield, deleteYield } from 'services/apiService'

export const useYields = (): {
  yields: Yield[]
  isLoading: boolean
  error: any
  createYield: (params: YieldInput) => Promise<{ error?: string }>
  updateYield: (id: string, params: Partial<YieldInput>) => Promise<{ error?: string }>
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
