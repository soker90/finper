import useSWR from 'swr'
import { SupplyReading, SupplyReadingInput } from 'types'
import { SUPPLIES_READINGS } from 'constants/api-paths'
import { addSupplyReading, editSupplyReading, deleteSupplyReading } from 'services/apiService'

export const useSupplyReadings = (supplyId: string | null) => {
  const key = supplyId ? `${SUPPLIES_READINGS}/supply/${supplyId}` : null
  const { data, error, mutate } = useSWR<SupplyReading[]>(key)

  const createReading = async (params: SupplyReadingInput) => {
    const result = await addSupplyReading(params)
    if (!result.error) await mutate()
    return result
  }

  const updateReading = async (id: string, params: SupplyReadingInput) => {
    const result = await editSupplyReading(id, params)
    if (!result.error) await mutate()
    return result
  }

  const removeReading = async (id: string) => {
    const result = await deleteSupplyReading(id)
    if (!result.error) await mutate()
    return result
  }

  return {
    readings: data ?? [],
    isLoading: supplyId != null && !data && !error,
    error,
    createReading,
    updateReading,
    removeReading
  }
}
