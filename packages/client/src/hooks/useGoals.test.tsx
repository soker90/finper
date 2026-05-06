// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import axios from 'axios'
import { server } from '../mock/server'
import { useGoals } from './useGoals'

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig
    value={{
      provider: () => new Map(),
      dedupingInterval: 0,
      fetcher: (url: string) => axios.get(url).then(res => res.data)
    }}
  >
    {children}
  </SWRConfig>
)

const SAMPLE_GOAL = {
  _id: 'g1',
  name: 'Coche nuevo',
  targetAmount: 10000,
  currentAmount: 2500,
  color: '#2196F3',
  icon: 'CarOutlined'
}

describe('useGoals', () => {
  it('returns empty array and isLoading=true while data is in flight', () => {
    const { result } = renderHook(() => useGoals(), { wrapper })
    expect(result.current.goals).toEqual([])
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeUndefined()
  })

  it('returns goals and isLoading=false once the request resolves', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json([SAMPLE_GOAL]))
    )
    const { result } = renderHook(() => useGoals(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.goals).toEqual([SAMPLE_GOAL])
    expect(result.current.error).toBeUndefined()
  })

  it('exposes the error and stops loading when the request fails', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json({ message: 'boom' }, { status: 500 }))
    )
    const { result } = renderHook(() => useGoals(), { wrapper })
    await waitFor(() => expect(result.current.error).toBeDefined())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.goals).toEqual([])
  })
})
