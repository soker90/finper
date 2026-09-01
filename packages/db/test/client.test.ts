import { describe, it, expect } from 'vitest'
import { createDb } from '../src/client'

describe('createDb', () => {
  it('creates a connected sqlite client using an in-memory database', () => {
    const db = createDb(':memory:')
    const row = db.$client.prepare('SELECT 1 AS value').get() as { value: number }
    expect(row.value).toBe(1)
  })
})
