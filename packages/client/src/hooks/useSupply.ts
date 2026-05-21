import { Supply, Property } from 'types'
import { useSupplies } from './useSupplies'

export const useSupply = (supplyId: string | undefined): { supply: Supply | null; property: Property | null; isLoading: boolean } => {
  const { properties, isLoading } = useSupplies()

  if (!supplyId) return { supply: null, property: null, isLoading }

  for (const prop of properties) {
    const found = prop.supplies.find((s) => s._id === supplyId)
    if (found) return { supply: found, property: { _id: prop._id, name: prop.name }, isLoading }
  }

  return { supply: null, property: null, isLoading }
}
