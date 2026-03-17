export interface Ticket {
  id: string
  telegram_message_id: number
  telegram_chat_id: number
  image_url: string | null
  date: number | null
  store: string | null
  amount: number | null
  raw_text: string | null
  status: 'pending' | 'reviewed'
  created_at: number
  reviewed_at: number | null
}

export interface ITicketService {
  getTickets(status?: string): Promise<Ticket[]>
  reviewTicket(id: string): Promise<void>
  deleteTicket(id: string): Promise<void>
}

export default class TicketService implements ITicketService {
  private get botUrl (): string {
    return process.env.TICKET_BOT_URL ?? ''
  }

  private get apiKey (): string {
    return process.env.TICKET_BOT_API_KEY ?? ''
  }

  private headers (): Record<string, string> {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    }
  }

  public async getTickets (status: string = 'pending'): Promise<Ticket[]> {
    const res = await fetch(`${this.botUrl}/api/tickets?status=${status}`, {
      headers: this.headers()
    })

    if (!res.ok) {
      throw new Error(`ticket-bot responded ${res.status}: ${await res.text()}`)
    }

    const data = await res.json() as { tickets: Ticket[] }
    return data.tickets
  }

  public async reviewTicket (id: string): Promise<void> {
    const res = await fetch(`${this.botUrl}/api/tickets/${id}`, {
      method: 'PATCH',
      headers: this.headers()
    })

    if (!res.ok) {
      throw new Error(`ticket-bot responded ${res.status}: ${await res.text()}`)
    }
  }

  public async deleteTicket (id: string): Promise<void> {
    const res = await fetch(`${this.botUrl}/api/tickets/${id}`, {
      method: 'DELETE',
      headers: this.headers()
    })

    if (!res.ok) {
      throw new Error(`ticket-bot responded ${res.status}: ${await res.text()}`)
    }
  }
}
