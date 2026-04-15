import { useMemo } from 'react'
import { Supply } from 'types'
import { useSupplies } from './useSupplies'

export const useSupply = (supplyId: string | undefined): { supply: Supply | null; isLoading: boolean } => {
  const { properties, isLoading } = useSupplies()

  const supply = useMemo(() => {
    if (!supplyId) return null
    for (const prop of properties) {
      const found = prop.supplies.find((s) => s._id === supplyId)
      if (found) return found
    }
    return null
  }, [properties, supplyId])

  return { supply, isLoading }
}
