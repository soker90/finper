import { db } from '../../db'
import { schema } from '@soker90/finper-db'
import { SQLiteRateLimitStore } from '../pension-transfer-rate-limit.middleware'

const { apiRateLimits } = schema

describe('SQLiteRateLimitStore', () => {
  const store = new SQLiteRateLimitStore()

  beforeEach(() => {
    db.delete(apiRateLimits).run()
  })

  afterAll(() => {
    db.delete(apiRateLimits).run()
  })

  test('increments an existing key and preserves its original reset time', async () => {
    const first = await store.increment('transfer-user')
    const second = await store.increment('transfer-user')

    expect(first.totalHits).toBe(1)
    expect(first.resetTime.getTime()).toBeGreaterThan(Date.now())
    expect(second.totalHits).toBe(2)
    expect(second.resetTime).toEqual(first.resetTime)
  })

  test('removes expired entries before creating a new window', async () => {
    db.insert(apiRateLimits).values({
      key: 'expired-user',
      hits: 10,
      resetAt: Date.now() - 1
    }).run()

    const result = await store.increment('expired-user')
    const row = db.select().from(apiRateLimits).get()

    expect(result.totalHits).toBe(1)
    expect(row).toMatchObject({ key: 'expired-user', hits: 1 })
  })

  test('decrements an existing counter without going below zero', async () => {
    await store.increment('transfer-user')
    await store.decrement('transfer-user')

    expect(db.select().from(apiRateLimits).get()?.hits).toBe(0)

    await store.decrement('transfer-user')
    expect(db.select().from(apiRateLimits).get()?.hits).toBe(0)
  })

  test('does nothing when decrementing an unknown key', async () => {
    await expect(store.decrement('missing-user')).resolves.toBeUndefined()
    expect(db.select().from(apiRateLimits).all()).toHaveLength(0)
  })

  test('resets one key without affecting other users', async () => {
    await store.increment('first-user')
    await store.increment('second-user')

    await store.resetKey('first-user')

    const rows = db.select().from(apiRateLimits).all()
    expect(rows).toHaveLength(1)
    expect(rows[0].key).toBe('second-user')
  })

  test('resets all keys', async () => {
    await store.increment('first-user')
    await store.increment('second-user')

    await store.resetAll()

    expect(db.select().from(apiRateLimits).all()).toHaveLength(0)
  })
})
