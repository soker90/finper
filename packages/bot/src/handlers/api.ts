import type { Context } from 'hono'
import type { Env } from '../types'
import { getTickets, markTicketReviewed, getTicketById, deleteTicket } from '../db/tickets'

/**
 * GET /api/tickets?status=pending|reviewed|all
 * Returns tickets list for finper-api to consume.
 * image_url is transformed from R2 key to a full Worker URL (/images/<key>).
 */
export async function getTicketsHandler (c: Context<{ Bindings: Env }>): Promise<Response> {
  const status = (c.req.query('status') as 'pending' | 'reviewed' | 'all') || 'pending'

  if (!['pending', 'reviewed', 'all'].includes(status)) {
    return c.json({ error: 'Invalid status. Use: pending, reviewed, all' }, 400)
  }

  const tickets = await getTickets(c.env.DB, status)

  // Build base URL from the incoming request (works in both dev and prod)
  const url = new URL(c.req.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const ticketsWithImageUrl = tickets.map(ticket => ({
    ...ticket,
    image_url: ticket.image_url ? `${baseUrl}/images/${ticket.image_url}` : null
  }))

  return c.json({ tickets: ticketsWithImageUrl, total: ticketsWithImageUrl.length })
}

/**
 * PATCH /api/tickets/:id
 * Marks a ticket as reviewed
 */
export async function reviewTicketHandler (c: Context<{ Bindings: Env }>): Promise<Response> {
  const id = c.req.param('id')

  if (!id) {
    return c.json({ error: 'Missing ticket id' }, 400)
  }

  const ticket = await getTicketById(c.env.DB, id)
  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404)
  }

  if (ticket.status === 'reviewed') {
    return c.json({ error: 'Ticket already reviewed' }, 409)
  }

  const updated = await markTicketReviewed(c.env.DB, id)

  if (!updated) {
    return c.json({ error: 'Failed to update ticket' }, 500)
  }

  return c.json({ success: true, id })
}

/**
 * DELETE /api/tickets/:id
 * Deletes the ticket from D1 and its image from R2
 */
export async function deleteTicketHandler (c: Context<{ Bindings: Env }>): Promise<Response> {
  const id = c.req.param('id')

  if (!id) {
    return c.json({ error: 'Missing ticket id' }, 400)
  }

  const ticket = await getTicketById(c.env.DB, id)
  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404)
  }

  // Delete image from R2 if present
  if (ticket.image_url) {
    await c.env.TICKET_IMAGES.delete(ticket.image_url)
  }

  const deleted = await deleteTicket(c.env.DB, id)
  if (!deleted) {
    return c.json({ error: 'Failed to delete ticket' }, 500)
  }

  return c.json({ success: true, id })
}
