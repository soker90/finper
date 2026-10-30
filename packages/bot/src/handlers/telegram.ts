import type { Context } from 'hono'
import type { Env, TelegramUpdate } from '../types'
import { downloadTelegramPhoto, sendTelegramMessage } from '../services/telegram'
import { uploadToR2, getR2Key } from '../services/r2'
import { extractReceiptData, extractExpenseFromText } from '../services/gemini'
import { insertTicket } from '../db/tickets'
import { isUserAllowed, getAllowedUser, addAllowedUser, removeAllowedUser, listAllowedUsers } from '../db/users'
import { generateId } from '../utils'

/**
 * Handles incoming Telegram webhook updates
 * Validates the secret token, user whitelist, and processes photo and text messages
 */
export async function telegramWebhookHandler (c: Context<{ Bindings: Env }>): Promise<Response> {
  // Validate Telegram secret token (sent as X-Telegram-Bot-Api-Secret-Token header)
  const secretToken = c.req.header('X-Telegram-Bot-Api-Secret-Token')
  if (!secretToken || secretToken !== c.env.TELEGRAM_SECRET_TOKEN) {
    console.error('Invalid Telegram secret token')
    return c.json({ ok: false }, 403)
  }

  let update: TelegramUpdate
  try {
    update = await c.req.json<TelegramUpdate>()
  } catch {
    return c.json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  const message = update.message
  if (!message) {
    // Not a message update (could be edited_message, channel_post, etc.) — ignore
    return c.json({ ok: true })
  }

  const chatId = message.chat.id
  const userId = message.from?.id

  if (!userId) {
    return c.json({ ok: true })
  }

  // Determine if this user is the admin
  const adminUserId = parseInt(c.env.TELEGRAM_ADMIN_USER_ID, 10)
  const isAdmin = userId === adminUserId

  // Check access: admin always allowed, others checked against DB
  if (!isAdmin) {
    const allowed = await isUserAllowed(c.env.DB, userId)
    if (!allowed) {
      console.warn(`Unauthorized Telegram user: ${userId}`)
      return c.json({ ok: true })
    }
  }

  // Handle text messages
  if (message.text) {
    const text = message.text.trim()

    if (text.startsWith('/start')) {
      await sendTelegramMessage(
        chatId,
        '👋 ¡Hola! Envíame una <b>foto</b> de un ticket o escribe el gasto directamente (por ejemplo: "He gastado 10€ en la frutería pagando con tarjeta").',
        c.env.TELEGRAM_BOT_TOKEN
      )
      return c.json({ ok: true })
    }

    // Admin-only commands
    if (text.startsWith('/adduser') || text.startsWith('/removeuser') || text.startsWith('/listusers')) {
      if (!isAdmin) {
        return c.json({ ok: true })
      }

      if (text.startsWith('/adduser')) {
        const parts = text.split(/\\s+/)
        const targetId = parseTelegramId(parts[1])
        const finperUsername = parts[2]
        if (targetId === null || !finperUsername || parts.length !== 3) {
          await sendTelegramMessage(chatId, '⚠️ Uso: /adduser <id_de_telegram> <usuario_finper>', c.env.TELEGRAM_BOT_TOKEN)
          return c.json({ ok: true })
        }
        const added = await addAllowedUser(c.env.DB, targetId, adminUserId, finperUsername)
        if (added) {
          const accountAdmin = await getAccountAdminId(c.env.DB, targetId)
          await sendTelegramMessage(chatId, `✅ Usuario <code>${targetId}</code> vinculado a <code>${finperUsername}</code>. Administrador de la cuenta: <code>${accountAdmin ?? 'sin determinar'}</code>.`, c.env.TELEGRAM_BOT_TOKEN)
        } else {
          await sendTelegramMessage(chatId, `ℹ️ El usuario <code>${targetId}</code> ya estaba vinculado. Usa /removeuser y vuelve a añadirlo para cambiar el usuario de Finper.`, c.env.TELEGRAM_BOT_TOKEN)
        }
        return c.json({ ok: true })
      }

      if (text.startsWith('/removeuser')) {
        const parts = text.split(/\s+/)
        const targetId = parseTelegramId(parts[1])
        if (targetId === null) {
          await sendTelegramMessage(chatId, '⚠️ Uso: /removeuser <id_de_telegram>', c.env.TELEGRAM_BOT_TOKEN)
          return c.json({ ok: true })
        }
        const removed = await removeAllowedUser(c.env.DB, targetId)
        if (removed) {
          await sendTelegramMessage(chatId, `✅ Usuario <code>${targetId}</code> eliminado correctamente.`, c.env.TELEGRAM_BOT_TOKEN)
        } else {
          await sendTelegramMessage(chatId, `ℹ️ El usuario <code>${targetId}</code> no estaba en la lista.`, c.env.TELEGRAM_BOT_TOKEN)
        }
        return c.json({ ok: true })
      }

      if (text.startsWith('/listusers')) {
        const users = await listAllowedUsers(c.env.DB)
        const lines = ['👥 <b>Usuarios con acceso:</b>', '']

        if (users.length === 0) {
          lines.push('ℹ️ No hay usuarios registrados.')
        } else {
          for (const u of users) {
            const date = formatDate(u.added_at)
            const linkInfo = u.finper_username ? `finper: ${u.finper_username}` : 'sin vincular'
            const accountRole = u.account_admin_id === u.user_id ? ' — administrador de cuenta' : u.account_admin_id != null ? ` — usuario; admin: <code>${u.account_admin_id}</code>` : ''
            lines.push(`• <code>${u.user_id}</code> — añadido el ${date} — ${linkInfo}${accountRole}`)
          }
        }
        await sendTelegramMessage(chatId, lines.join('\\n'), c.env.TELEGRAM_BOT_TOKEN)
        return c.json({ ok: true })
      }
