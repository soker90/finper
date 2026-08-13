import type { Context } from 'hono'
import type { Env, Ticket } from '../types'
import { getTickets, getTicketById, deleteTicket } from '../db/tickets'

/**
 * Deletes a ticket's image from R2 (if present) and its row from D1.
 */
async function deleteTicketAndImage (env: Env, ticket: Ticket): Promise<boolean> {
  if (ticket.image_url) {
    await env.TICKET_IMAGES.delete(ticket.image_url)
  }
  return deleteTicket(env.DB, ticket.id)
}

/**
 * GET /api/tickets?status=pending|reviewed|all&finper_username=
 * Returns tickets list for finper-api to consume.
 * image_url is transformed from R2 key to a full Worker URL (/images/<key>).
 * finper_username is required: only tickets sent by Telegram users linked to
 * that Finper username are returned. Tickets without a telegram_user_id
 * (legacy rows) are never returned.
 */
export async function getTicketsHandler (c: Context<{ Bindings: Env }>): Promise<Response> {
  const status = (c.req.query('status') as 'pending' | 'reviewed' | 'all') || 'pending'
  const finperUsername = c.req.query('finper_username')

  if (!['pending', 'reviewed', 'all'].includes(status)) {
    return c.json({ error: 'Invalid status. Use: pending, reviewed, all' }, 400)
  }

  if (!finperUsername) {
    return c.json({ error: 'Missing finper_username' }, 400)
  }

  const tickets = await getTickets(c.env.DB, status, finperUsername)

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
 * Marks a ticket as reviewed. The transaction has already been created in
 * Finper at this point, so the ticket and its image are no longer needed
 * and are deleted (same as DELETE).
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

  const deleted = await deleteTicketAndImage(c.env, ticket)

  if (!deleted) {
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

  const deleted = await deleteTicketAndImage(c.env, ticket)
  if (!deleted) {
    return c.json({ error: 'Failed to delete ticket' }, 500)
  }

  return c.json({ success: true, id })
}
