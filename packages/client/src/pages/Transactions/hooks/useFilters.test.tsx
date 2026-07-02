import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFilters } from './useFilters'

const EMPTY_FILTERS = {
  category: '',
  type: '',
  account: '',
  store: ''
}

describe('useFilters', () => {
  it('starts with all filter values set to an empty string', () => {
    const { result } = renderHook(() => useFilters())

    expect(result.current.filters).toEqual(EMPTY_FILTERS)
  })

  it('updates only the given key when calling setFilter', () => {
    const { result } = renderHook(() => useFilters())

    act(() => result.current.setFilter('account', 'acc-1'))

    expect(result.current.filters).toEqual({ ...EMPTY_FILTERS, account: 'acc-1' })
  })

  it('keeps previously set filters when setting a different key', () => {
    const { result } = renderHook(() => useFilters())

    act(() => result.current.setFilter('account', 'acc-1'))
    act(() => result.current.setFilter('store', 'store-1'))

    expect(result.current.filters).toEqual({
      ...EMPTY_FILTERS,
      account: 'acc-1',
      store: 'store-1'
    })
  })

  it('restores all filters to an empty string when calling resetFilter', () => {
    const { result } = renderHook(() => useFilters())

    act(() => result.current.setFilter('category', 'cat-1'))
    act(() => result.current.resetFilter())

    expect(result.current.filters).toEqual(EMPTY_FILTERS)
  })
})
