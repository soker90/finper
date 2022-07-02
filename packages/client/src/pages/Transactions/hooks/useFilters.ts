import { useReducer } from 'react'

interface FilterAction {
    type: 'set' | 'reset';
    key?: string;
    value?: string
}

export interface FilterParams {
    setFilter: (key: string, value: string) => void,
    resetFilter: () => void,
    filters: any,
}

export const useFilters = (): FilterParams => {
  const [filters, setFilters] = useReducer(
    (state: any, { type, key, value }: FilterAction) => ({
      set: { ...state, [key as string]: value },
      reset: {
        category: '',
        type: '',
        account: '',
        store: ''
      }
    }[type]),
    {})

  const setFilter = (key: string, value: string) => setFilters({ type: 'set', key, value })
  const resetFilter = () => setFilters({ type: 'reset' })

  return { setFilter, resetFilter, filters }
}
