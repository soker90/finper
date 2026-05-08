import useSWR from 'swr'
import { PropertyWithSupplies, PropertyInput, SupplyInput } from 'types'
import { SUPPLIES } from 'constants/api-paths'
import {
  addProperty,
  editProperty,
  deleteProperty,
  addSupply,
  editSupply,
  deleteSupply
} from 'services/apiService'

export const useSupplies = () => {
  const { data, error, mutate, isLoading } = useSWR<PropertyWithSupplies[]>(SUPPLIES)

  const createProperty = async (params: PropertyInput) => {
    const result = await addProperty(params)
    if (!result.error) await mutate()
    return result
  }

  const updateProperty = async (id: string, params: PropertyInput) => {
    const result = await editProperty(id, params)
    if (!result.error) await mutate()
    return result
  }

  const removeProperty = async (id: string) => {
    const result = await deleteProperty(id)
    if (!result.error) await mutate()
    return result
  }

  const createSupply = async (params: SupplyInput) => {
    const result = await addSupply(params)
    if (!result.error) await mutate()
    return result
  }

  const updateSupply = async (id: string, params: SupplyInput) => {
    const result = await editSupply(id, params)
    if (!result.error) await mutate()
    return result
  }

  const removeSupply = async (id: string) => {
    const result = await deleteSupply(id)
    if (!result.error) await mutate()
    return result
  }

  return {
    properties: data ?? [],
    isLoading,
    error,
    createProperty,
    updateProperty,
    removeProperty,
    createSupply,
    updateSupply,
    removeSupply
  }
}
