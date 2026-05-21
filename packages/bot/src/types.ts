export interface Ticket {
  id: string
  telegram_message_id: number
  telegram_chat_id: number
  image_url: string | null
  date: number | null
  store: string | null
  amount: number | null
  raw_text: string | null
  payment_method: string | null
  status: 'pending' | 'reviewed'
  created_at: number
  reviewed_at: number | null
}

export interface GeminiExtraction {
  date: number | null     // Unix timestamp ms, or null if not found
  store: string | null    // Merchant name, or null if not found
  amount: number | null   // Total amount as number, or null if not found
  raw_text: string        // kept for DB compatibility, always empty string for photo tickets
  payment_method: string | null  // Payment method (e.g. "efectivo", "tarjeta", "bankinter"), or null
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  photo?: TelegramPhotoSize[]
  text?: string
}

export interface TelegramUser {
  id: number
  username?: string
  first_name: string
}

export interface TelegramChat {
  id: number
}

export interface TelegramPhotoSize {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export interface TelegramFile {
  file_id: string
  file_path: string
}

export type Env = {
  // D1 Database
  DB: D1Database
  // R2 Bucket
  TICKET_IMAGES: R2Bucket
  // Secrets
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_SECRET_TOKEN: string
  TELEGRAM_ADMIN_USER_ID: string
  GEMINI_API_KEY: string
  API_SECRET_KEY: string
  // Vars
  ENVIRONMENT: string
}
