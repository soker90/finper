import type { Context, Next } from 'hono'
import type { Env } from '../types'

/**
 * Middleware that validates the X-API-Key header
 * Used to protect the /api/* endpoints consumed by finper-api
 */
export async function apiKeyMiddleware (
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const apiKey = c.req.header('X-API-Key')

  if (!apiKey || apiKey !== c.env.API_SECRET_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return next()
}
