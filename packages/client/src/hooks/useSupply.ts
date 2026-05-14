import { useMemo } from 'react'
import { Supply, Property } from 'types'
import { useSupplies } from './useSupplies'

export const useSupply = (supplyId: string | undefined): { supply: Supply | null; property: Property | null; isLoading: boolean } => {
  const { properties, isLoading } = useSupplies()

  const { supply, property } = useMemo(() => {
    if (!supplyId) return { supply: null, property: null }

    const supplyIndex = new Map<string, { supply: Supply; property: Property }>()
    for (const prop of properties) {
      for (const s of prop.supplies) {
        supplyIndex.set(s._id, { supply: s, property: { _id: prop._id, name: prop.name } })
      }
    }

    return supplyIndex.get(supplyId) ?? { supply: null, property: null }
  }, [properties, supplyId])

  return { supply, property, isLoading }
}
