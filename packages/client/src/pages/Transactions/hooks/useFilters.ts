import { useReducer } from 'react'
import { TransactionFilters } from 'types'

type FilterKey = keyof TransactionFilters

type FilterAction =
  | { type: 'set', key: FilterKey, value: string }
  | { type: 'reset' }

export interface FilterParams {
  setFilter: (key: FilterKey, value: string) => void,
  resetFilter: () => void,
  filters: TransactionFilters,
}

const emptyFilters: TransactionFilters = {
  category: '',
  type: '',
  account: '',
  store: ''
}

const filtersReducer = (state: TransactionFilters, action: FilterAction): TransactionFilters => {
  if (action.type === 'set') {
    return { ...state, [action.key]: action.value }
  }
  return emptyFilters
}

export const useFilters = (): FilterParams => {
  const [filters, setFilters] = useReducer(filtersReducer, emptyFilters)

  const setFilter = (key: FilterKey, value: string) => setFilters({ type: 'set', key, value })
  const resetFilter = () => setFilters({ type: 'reset' })

  return { setFilter, resetFilter, filters }
}
