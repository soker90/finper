import { Hono } from 'hono'
import type { Env } from './types'
import { telegramWebhookHandler } from './handlers/telegram'
import { getTicketsHandler, reviewTicketHandler, deleteTicketHandler } from './handlers/api'
import { apiKeyMiddleware } from './middleware/auth'

const app = new Hono<{ Bindings: Env }>()

// ─── Telegram webhook ─────────────────────────────────────────────────────────
// Telegram sends POST requests here. Protected by secret token in header.
app.post('/webhook', telegramWebhookHandler)

// ─── R2 image serving ─────────────────────────────────────────────────────────
// Serves ticket images stored in R2. Path matches the key stored in D1.
app.get('/images/*', async (c) => {
  const url = new URL(c.req.url)
  const key = url.pathname.replace(/^\/images\//, '')

  if (!key) return c.json({ error: 'Not found' }, 404)

  const object = await c.env.TICKET_IMAGES.get(key)
  if (!object) return c.json({ error: 'Image not found' }, 404)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  headers.set('access-control-allow-origin', '*')

  return new Response(object.body, { headers })
})

// ─── REST API for finper-api ───────────────────────────────────────────────────
// All /api/* routes require X-API-Key header
app.use('/api/*', apiKeyMiddleware)

app.get('/api/tickets', getTicketsHandler)
app.patch('/api/tickets/:id', reviewTicketHandler)
app.delete('/api/tickets/:id', deleteTicketHandler)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', service: 'ticket-bot' }))

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.all('*', (c) => c.json({ error: 'Not found' }, 404))

export default app
