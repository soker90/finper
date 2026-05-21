import type { Ticket } from '../types'

export async function insertTicket (
  db: D1Database,
  ticket: Omit<Ticket, 'status' | 'reviewed_at'>
): Promise<void> {
  await db.prepare(`
    INSERT INTO tickets (id, telegram_message_id, telegram_chat_id, image_url, date, store, amount, raw_text, payment_method, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).bind(
    ticket.id,
    ticket.telegram_message_id,
    ticket.telegram_chat_id,
    ticket.image_url,
    ticket.date,
    ticket.store,
    ticket.amount,
    ticket.raw_text,
    ticket.payment_method,
    ticket.created_at
  ).run()
}

export async function getTickets (
  db: D1Database,
  status: 'pending' | 'reviewed' | 'all' = 'pending'
): Promise<Ticket[]> {
  let query = 'SELECT * FROM tickets'
  const params: string[] = []

  if (status !== 'all') {
    query += ' WHERE status = ?'
    params.push(status)
  }

  query += ' ORDER BY created_at DESC'

  const result = await db.prepare(query).bind(...params).all<Ticket>()
  return result.results
}

export async function markTicketReviewed (
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE tickets SET status = 'reviewed', reviewed_at = ? WHERE id = ? AND status = 'pending'
  `).bind(Date.now(), id).run()

  return (result.meta.changes ?? 0) > 0
}

export async function getTicketById (
  db: D1Database,
  id: string
): Promise<Ticket | null> {
  const result = await db.prepare('SELECT * FROM tickets WHERE id = ?')
    .bind(id)
    .first<Ticket>()
  return result ?? null
}

export async function deleteTicket (
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db.prepare('DELETE FROM tickets WHERE id = ?')
    .bind(id)
    .run()
  return (result.meta.changes ?? 0) > 0
}
