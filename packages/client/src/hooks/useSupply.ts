import { useMemo } from 'react'
import { Supply, Property } from 'types'
import { useSupplies } from './useSupplies'

export const useSupply = (supplyId: string | undefined): { supply: Supply | null; property: Property | null; isLoading: boolean } => {
  const { properties, isLoading } = useSupplies()

  const { supply, property } = useMemo(() => {
    if (!supplyId) return { supply: null, property: null }
    for (const prop of properties) {
      const found = prop.supplies.find((s) => s._id === supplyId)
      if (found) return { supply: found, property: { _id: prop._id, name: prop.name } }
    }
    return { supply: null, property: null }
  }, [properties, supplyId])

  return { supply, property, isLoading }
}
