import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mock/server'

global.HTMLElement.prototype.detachEvent = function(type, listener) {
  this.removeEventListener(type.replace('on', ''), listener)
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())
