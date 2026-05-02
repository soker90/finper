import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mock/server'

// happy-dom does not provide a functional localStorage — mock it globally
// so that Auth mounts correctly in all test environments.
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length () { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: false })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  localStorageMock.clear()
})
