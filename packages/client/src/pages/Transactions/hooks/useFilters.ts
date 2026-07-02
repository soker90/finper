import { useReducer } from 'react'
import { TransactionFilters } from 'types'

type FilterKey = keyof TransactionFilters

interface FilterAction {
  type: 'set' | 'reset';
  key?: FilterKey;
  value?: string
}

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

const filtersReducer = (state: TransactionFilters, { type, key, value }: FilterAction): TransactionFilters => ({
  set: { ...state, [key as FilterKey]: value },
  reset: emptyFilters
}[type])

export const useFilters = (): FilterParams => {
  const [filters, setFilters] = useReducer(filtersReducer, {})

  const setFilter = (key: FilterKey, value: string) => setFilters({ type: 'set', key, value })
  const resetFilter = () => setFilters({ type: 'reset' })

  return { setFilter, resetFilter, filters }
}
