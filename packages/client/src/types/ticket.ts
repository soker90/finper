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
