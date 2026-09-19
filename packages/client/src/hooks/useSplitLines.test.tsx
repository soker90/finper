// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useForm, type Control } from 'react-hook-form'
import { SPLIT_ERROR, useSplitLines } from './useSplitLines'

describe('useSplitLines', () => {
  const useTestSplitLines = () => {
    const { control, watch, setValue } = useForm({
      defaultValues: {
        amount: 100,
        category: 'cat1',
        tags: [],
        splits: []
      }
    })
    return useSplitLines({
      control: control as unknown as Control<any>,
      watch,
      setValue,
      categoryFieldName: 'category',
      initialSplitMode: false
    })
  }

  it('caps split lines at 5 when using addLine', () => {
    const { result } = renderHook(() => useTestSplitLines())

    act(() => {
      result.current.enableSplitMode()
    })
    expect(result.current.fields).toHaveLength(2)

    act(() => {
      result.current.addLine()
    })
    expect(result.current.fields).toHaveLength(3)

    act(() => {
      result.current.addLine()
    })
    expect(result.current.fields).toHaveLength(4)

    act(() => {
      result.current.addLine()
    })
    expect(result.current.fields).toHaveLength(5)

    act(() => {
      result.current.addLine()
    })
    expect(result.current.fields).toHaveLength(5)
  })

  it('allows the same category in multiple split lines when amounts match', () => {
    const { result } = renderHook(() => {
      const { control, watch, setValue } = useForm({
        defaultValues: {
          amount: 100,
          category: 'cat1',
          tags: [],
          splits: [
            { category: 'cat1', amount: 60, tags: ['tagA'] },
            { category: 'cat1', amount: 40, tags: ['tagB'] }
          ]
        }
      })
      return useSplitLines({
        control: control as unknown as Control<any>,
        watch,
        setValue,
        categoryFieldName: 'category',
        initialSplitMode: true
      })
    })

    expect(result.current.isAmountMismatch).toBe(false)
    expect(result.current.splitError).toBeNull()
  })

  it('reports amount mismatch when split sum does not match total amount', () => {
    const { result } = renderHook(() => {
      const { control, watch, setValue } = useForm({
        defaultValues: {
          amount: 100,
          category: 'cat1',
          tags: [],
          splits: [
            { category: 'cat1', amount: 60, tags: [] },
            { category: 'cat1', amount: 30, tags: [] }
          ]
        }
      })
      return useSplitLines({
        control: control as unknown as Control<any>,
        watch,
        setValue,
        categoryFieldName: 'category',
        initialSplitMode: true
      })
    })

    expect(result.current.isAmountMismatch).toBe(true)
    expect(result.current.splitError).toBe(SPLIT_ERROR.AMOUNT_MISMATCH)
  })
})
