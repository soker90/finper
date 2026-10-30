import { eq, lte } from 'drizzle-orm'
import { rateLimit, type Store } from 'express-rate-limit'
import { schema } from '@soker90/finper-db'

import { db } from '../db'

const { apiRateLimits } = schema
const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

/**
 * SQLite-backed store keeps the transfer quota consistent across API
 * instances that share Finper's database file.
 */
class SQLiteRateLimitStore implements Store {
  localKeys = false

  async increment (key: string) {
    const now = Date.now()
    return db.transaction((tx) => {
      tx.delete(apiRateLimits).where(lte(apiRateLimits.resetAt, now)).run()

      const current = tx.select()
        .from(apiRateLimits)
        .where(eq(apiRateLimits.key, key))
        .get()

      if (!current) {
        const resetAt = now + WINDOW_MS
        tx.insert(apiRateLimits).values({ key, hits: 1, resetAt }).run()
        return { totalHits: 1, resetTime: new Date(resetAt) }
      }

      const totalHits = current.hits + 1
      tx.update(apiRateLimits)
        .set({ hits: totalHits })
        .where(eq(apiRateLimits.key, key))
        .run()

      return { totalHits, resetTime: new Date(current.resetAt) }
    }, { behavior: 'immediate' })
  }

  async decrement (key: string): Promise<void> {
    db.transaction((tx) => {
      const current = tx.select()
        .from(apiRateLimits)
        .where(eq(apiRateLimits.key, key))
        .get()

      if (current && current.hits > 0) {
        tx.update(apiRateLimits)
          .set({ hits: current.hits - 1 })
          .where(eq(apiRateLimits.key, key))
          .run()
      }
    }, { behavior: 'immediate' })
  }

  async resetKey (key: string): Promise<void> {
    db.delete(apiRateLimits).where(eq(apiRateLimits.key, key)).run()
  }

  async resetAll (): Promise<void> {
    db.delete(apiRateLimits).run()
  }
}

export const pensionTransferRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_REQUESTS,
  keyGenerator: (req) => req.user as string,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Has alcanzado el límite de traspasos. Inténtalo de nuevo dentro de un minuto.' },
  store: new SQLiteRateLimitStore()
})
