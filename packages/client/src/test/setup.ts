import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from '../mock/server'

// https://github.com/capricorn86/happy-dom/issues/467
// @ts-ignore
global.HTMLElement.prototype.detachEvent = function (type, listener) {
  this.removeEventListener(type.replace('on', ''), listener)
}

global.structuredClone = vi.fn(val => {
  return JSON.parse(JSON.stringify(val))
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())
