-- Cloudflare D1 (SQLite) schema for ticket-bot
-- Run: wrangler d1 execute ticket-bot-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  telegram_message_id INTEGER NOT NULL,
  telegram_chat_id INTEGER NOT NULL,
  image_url TEXT,                          -- nullable: text-sourced tickets have no image
  -- Data extracted by Gemini
  date INTEGER,                            -- Unix timestamp (ms) extracted from ticket
  store TEXT,                              -- Merchant/store name extracted
  amount REAL,                             -- Total amount extracted
  raw_text TEXT,                           -- Original user message (text tickets) or full OCR text
  payment_method TEXT,                     -- Payment method extracted (e.g. "efectivo", "tarjeta", "bankinter")
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | reviewed
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- Users allowed to send tickets to the bot (managed by the admin via bot commands)
CREATE TABLE IF NOT EXISTS allowed_users (
  user_id   INTEGER PRIMARY KEY,  -- Telegram user ID
  added_by  INTEGER NOT NULL,      -- Telegram user ID of the admin who added them
  added_at  INTEGER NOT NULL       -- Unix timestamp (ms)
);
