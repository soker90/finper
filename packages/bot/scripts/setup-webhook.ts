#!/usr/bin/env tsx
/**
 * Script to register the Telegram webhook for the bot.
 * Run: pnpm setup:webhook
 *
 * Required environment variables:
 *   TELEGRAM_BOT_TOKEN      - your bot token from @BotFather
 *   TELEGRAM_SECRET_TOKEN   - a random secret you generate once (keep it secret)
 *   WORKER_URL              - your Cloudflare Worker URL (e.g. https://ticket-bot.yourdomain.workers.dev)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN
const WORKER_URL = process.env.WORKER_URL

if (!BOT_TOKEN || !SECRET_TOKEN || !WORKER_URL) {
  console.error('Missing required environment variables:')
  console.error('  TELEGRAM_BOT_TOKEN:', BOT_TOKEN ? '✓' : '✗ MISSING')
  console.error('  TELEGRAM_SECRET_TOKEN:', SECRET_TOKEN ? '✓' : '✗ MISSING')
  console.error('  WORKER_URL:', WORKER_URL ? '✓' : '✗ MISSING')
  process.exit(1)
}

const webhookUrl = `${WORKER_URL}/webhook`

async function setWebhook () {
  console.log(`\nSetting Telegram webhook to: ${webhookUrl}`)

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: SECRET_TOKEN,
        allowed_updates: ['message'],
        drop_pending_updates: true
      })
    }
  )

  const data = await response.json() as { ok: boolean; description?: string }

  if (data.ok) {
    console.log('✅ Webhook registered successfully!')
    console.log(`   URL: ${webhookUrl}`)
  } else {
    console.error('❌ Failed to set webhook:', data.description)
    process.exit(1)
  }
}

async function getWebhookInfo () {
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
  )
  const data = await response.json() as { ok: boolean; result: Record<string, unknown> }
  console.log('\nWebhook info:')
  console.log(JSON.stringify(data.result, null, 2))
}

void (async () => {
  await setWebhook()
  await getWebhookInfo()
})()
