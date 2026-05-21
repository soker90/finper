import type { Context } from 'hono'
import type { Env, TelegramUpdate } from '../types'
import { downloadTelegramPhoto, sendTelegramMessage } from '../services/telegram'
import { uploadToR2, getR2Key } from '../services/r2'
import { extractReceiptData, extractExpenseFromText } from '../services/gemini'
import { insertTicket } from '../db/tickets'
import { isUserAllowed, addAllowedUser, removeAllowedUser, listAllowedUsers } from '../db/users'
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
        const parts = text.split(/\s+/)
        const targetId = parts[1] ? parseInt(parts[1], 10) : NaN
        if (isNaN(targetId)) {
          await sendTelegramMessage(chatId, '⚠️ Uso: /adduser <id_de_telegram>', c.env.TELEGRAM_BOT_TOKEN)
          return c.json({ ok: true })
        }
        if (targetId === adminUserId) {
          await sendTelegramMessage(chatId, 'ℹ️ El administrador ya tiene acceso por defecto.', c.env.TELEGRAM_BOT_TOKEN)
          return c.json({ ok: true })
        }
        const added = await addAllowedUser(c.env.DB, targetId, adminUserId)
        if (added) {
          await sendTelegramMessage(chatId, `✅ Usuario <code>${targetId}</code> añadido correctamente.`, c.env.TELEGRAM_BOT_TOKEN)
        } else {
          await sendTelegramMessage(chatId, `ℹ️ El usuario <code>${targetId}</code> ya tenía acceso.`, c.env.TELEGRAM_BOT_TOKEN)
        }
        return c.json({ ok: true })
      }

      if (text.startsWith('/removeuser')) {
        const parts = text.split(/\s+/)
        const targetId = parts[1] ? parseInt(parts[1], 10) : NaN
        if (isNaN(targetId)) {
          await sendTelegramMessage(chatId, '⚠️ Uso: /removeuser <id_de_telegram>', c.env.TELEGRAM_BOT_TOKEN)
          return c.json({ ok: true })
        }
        if (targetId === adminUserId) {
          await sendTelegramMessage(chatId, '⛔ No puedes eliminar al administrador.', c.env.TELEGRAM_BOT_TOKEN)
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
        if (users.length === 0) {
          await sendTelegramMessage(chatId, 'ℹ️ No hay usuarios adicionales con acceso.\n\nSolo tú (admin) tienes acceso actualmente.', c.env.TELEGRAM_BOT_TOKEN)
        } else {
          const lines = ['👥 <b>Usuarios con acceso:</b>', '']
          lines.push(`• <code>${adminUserId}</code> — admin (tú)`)
          for (const u of users) {
            const date = new Date(u.added_at).toLocaleDateString('es-ES')
            lines.push(`• <code>${u.user_id}</code> — añadido el ${date}`)
          }
          await sendTelegramMessage(chatId, lines.join('\n'), c.env.TELEGRAM_BOT_TOKEN)
        }
        return c.json({ ok: true })
      }
    }

    // Free-text expense: process with Gemini
    const processingPromise = processTicketText(text, message.message_id, chatId, userId, isAdmin, adminUserId, c.env)
    c.executionCtx.waitUntil(processingPromise)

    await sendTelegramMessage(chatId, '⏳ Procesando gasto...', c.env.TELEGRAM_BOT_TOKEN)
    return c.json({ ok: true })
  }

  // Handle photo messages
  if (!message.photo || message.photo.length === 0) {
    return c.json({ ok: true })
  }

  // Acknowledge immediately — Telegram requires response within 5s
  // We use waitUntil to process async without blocking the response
  const processingPromise = processTicketPhoto(
    message.photo,
    message.message_id,
    chatId,
    userId,
    isAdmin,
    adminUserId,
    c.env
  )
  c.executionCtx.waitUntil(processingPromise)

  await sendTelegramMessage(chatId, '⏳ Procesando ticket...', c.env.TELEGRAM_BOT_TOKEN)

  return c.json({ ok: true })
}

async function processTicketText (
  userText: string,
  messageId: number,
  chatId: number,
  userId: number,
  isAdmin: boolean,
  adminUserId: number,
  env: Env
): Promise<void> {
  try {
    // 1. Extract data from text with Gemini
    const extraction = await extractExpenseFromText(userText, env.GEMINI_API_KEY)

    // 2. Save ticket to D1 (image_url = null, raw_text = original message)
    const ticketId = generateId()
    await insertTicket(env.DB, {
      id: ticketId,
      telegram_message_id: messageId,
      telegram_chat_id: chatId,
      image_url: null,
      date: extraction.date,
      store: extraction.store,
      amount: extraction.amount,
      raw_text: userText,
      payment_method: extraction.payment_method,
      created_at: Date.now()
    })

    // 3. Notify user with what was understood
    const lines: string[] = ['✅ <b>Gasto registrado</b>']
    lines.push(`🏪 Comercio: ${extraction.store ?? 'No detectado'}`)
    lines.push(`📅 Fecha: ${extraction.date ? formatDate(extraction.date) : 'No detectada'}`)
    lines.push(`💶 Total: ${extraction.amount != null ? `${extraction.amount.toFixed(2)} €` : 'No detectado'}`)
    lines.push(`💳 Pago: ${extraction.payment_method ?? 'No detectado'}`)
    lines.push('')
    lines.push('Puedes revisarlo en Finper → Tickets pendientes.')

    await sendTelegramMessage(chatId, lines.join('\n'), env.TELEGRAM_BOT_TOKEN)

    // 4. Notify admin if the sender is not the admin
    if (!isAdmin) {
      const adminLines: string[] = [`🔔 <b>Nuevo gasto de usuario <code>${userId}</code></b>`, '']
      adminLines.push(`🏪 Comercio: ${extraction.store ?? 'No detectado'}`)
      adminLines.push(`📅 Fecha: ${extraction.date ? formatDate(extraction.date) : 'No detectada'}`)
      adminLines.push(`💶 Total: ${extraction.amount != null ? `${extraction.amount.toFixed(2)} €` : 'No detectado'}`)
      adminLines.push(`💳 Pago: ${extraction.payment_method ?? 'No detectado'}`)
      await sendTelegramMessage(adminUserId, adminLines.join('\n'), env.TELEGRAM_BOT_TOKEN)
    }
  } catch (err) {
    console.error('Error processing text expense:', err)
    await sendTelegramMessage(
      chatId,
      '❌ Error al procesar el gasto. Inténtalo de nuevo.',
      env.TELEGRAM_BOT_TOKEN
    )
  }
}

async function processTicketPhoto (
  photos: NonNullable<TelegramUpdate['message']>['photo'],
  messageId: number,
  chatId: number,
  userId: number,
  isAdmin: boolean,
  adminUserId: number,
  env: Env
): Promise<void> {
  if (!photos) return

  // Pick the largest resolution photo (last in array)
  const largestPhoto = photos[photos.length - 1]
  if (!largestPhoto) return

  try {
    // 1. Download photo from Telegram
    const { buffer } = await downloadTelegramPhoto(
      largestPhoto.file_id,
      env.TELEGRAM_BOT_TOKEN
    )

    // 2. Upload to R2
    const ticketId = generateId()
    const r2Key = getR2Key(ticketId)
    await uploadToR2(env.TICKET_IMAGES, buffer, r2Key)

    // 3. Extract data with Gemini Vision
    const extraction = await extractReceiptData(buffer, env.GEMINI_API_KEY)

    // 4. Save ticket to D1
    await insertTicket(env.DB, {
      id: ticketId,
      telegram_message_id: messageId,
      telegram_chat_id: chatId,
      image_url: r2Key,
      date: extraction.date,
      store: extraction.store,
      amount: extraction.amount,
      raw_text: extraction.raw_text,
      payment_method: extraction.payment_method,
      created_at: Date.now()
    })

    // 5. Notify user with extracted data
    const lines: string[] = ['✅ <b>Ticket procesado</b>']
    lines.push(`🏪 Comercio: ${extraction.store ?? 'No detectado'}`)
    lines.push(`📅 Fecha: ${extraction.date ? formatDate(extraction.date) : 'No detectada'}`)
    lines.push(`💶 Total: ${extraction.amount != null ? `${extraction.amount.toFixed(2)} €` : 'No detectado'}`)
    lines.push(`💳 Pago: ${extraction.payment_method ?? 'No detectado'}`)
    lines.push('')
    lines.push('Puedes revisarlo en Finper → Tickets pendientes.')

    await sendTelegramMessage(chatId, lines.join('\n'), env.TELEGRAM_BOT_TOKEN)

    // 6. Notify admin if the sender is not the admin
    if (!isAdmin) {
      const adminLines: string[] = [`🔔 <b>Nuevo ticket de usuario <code>${userId}</code></b>`, '']
      adminLines.push(`🏪 Comercio: ${extraction.store ?? 'No detectado'}`)
      adminLines.push(`📅 Fecha: ${extraction.date ? formatDate(extraction.date) : 'No detectada'}`)
      adminLines.push(`💶 Total: ${extraction.amount != null ? `${extraction.amount.toFixed(2)} €` : 'No detectado'}`)
      adminLines.push(`💳 Pago: ${extraction.payment_method ?? 'No detectado'}`)
      await sendTelegramMessage(adminUserId, adminLines.join('\n'), env.TELEGRAM_BOT_TOKEN)
    }
  } catch (err) {
    console.error('Error processing ticket:', err)
    await sendTelegramMessage(
      chatId,
      '❌ Error al procesar el ticket. Inténtalo de nuevo.',
      env.TELEGRAM_BOT_TOKEN
    )
  }
}

function formatDate (timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid'
  })
}
