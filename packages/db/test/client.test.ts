import { describe, it, expect } from 'vitest'
import { sql } from 'drizzle-orm'
import { createDb } from '../src/client'

describe('createDb', () => {
  it('creates a connected sqlite client using an in-memory database', () => {
    const db = createDb(':memory:')
    const row = db.get<{ value: number }>(sql`SELECT 1 AS value`)
    expect(row.value).toBe(1)
  })
})
