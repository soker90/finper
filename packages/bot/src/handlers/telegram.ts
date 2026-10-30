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
        const parts = text.split(/\s+/)
        const targetId = parseTelegramId(parts[1])
        const finperUsername = parts[2]
        if (targetId === null || !finperUsername || parts.length !== 3) {
          await sendTelegramMessage(chatId, '⚠️ Uso: /adduser <id_de_telegram> <usuario_finper>', c.env.TELEGRAM_BOT_TOKEN)
          return c.json({ ok: true })
        }
        const added = await addAllowedUser(c.env.DB, targetId, adminUserId, finperUsername)
        if (added) {
          const accountAdmin = await getAccountAdminId(c.env.DB, targetId)
          await sendTelegramMessage(chatId, \`✅ Usuario <code>\${targetId}</code> vinculado a <code>\${finperUsername}</code>. Administrador de la cuenta: <code>\${accountAdmin ?? 'sin determinar'}</code>.\`, c.env.TELEGRAM_BOT_TOKEN)
        } else {
          await sendTelegramMessage(chatId, \`ℹ️ El usuario <code>\${targetId}</code> ya estaba vinculado. Usa /removeuser y vuelve a añadirlo para cambiar el usuario de Finper.\`, c.env.TELEGRAM_BOT_TOKEN)
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
            const linkInfo = u.finper_username ? \`finper: \${u.finper_username}\` : 'sin vincular'
            const accountRole = u.account_admin_id === u.user_id ? ' — administrador de cuenta' : u.account_admin_id != null ? \` — usuario; admin: <code>\${u.account_admin_id}</code>\` : ''
            lines.push(\`• <code>\${u.user_id}</code> — añadido el \${date} — \${linkInfo}\${accountRole}\`)
          }
        }
        await sendTelegramMessage(chatId, lines.join('\\n'), c.env.TELEGRAM_BOT_TOKEN)
        return c.json({ ok: true })
      }
    }

    // Free-text expense: process with Gemini
    const processingPromise = processTicketText(text, message.message_id, chatId, userId, c.env)
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
  env: Env
): Promise<void> {
  try {
    // 1. Extract data from text with Gemini
    const extraction = await extractExpenseFromText(userText, env.GEMINI_API_KEY)

    // Resolve the notification recipient before saving. A lookup failure must not
    // turn an already-saved ticket into an apparent processing failure.
    const notificationAdminId = await resolveNotificationAdmin(env, userId)

    // 2. Save ticket to D1 (image_url = null, raw_text = original message)
    const ticketId = generateId()
    await insertTicket(env.DB, {
      id: ticketId,
      telegram_message_id: messageId,
      telegram_chat_id: chatId,
      telegram_user_id: userId,
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

    // 4. Notify only the explicitly assigned account admin.
    if (notificationAdminId !== null && notificationAdminId !== userId) {
      const adminLines: string[] = [`🔔 <b>Nuevo gasto de usuario <code>${userId}</code></b>`, '']
      adminLines.push(`🏪 Comercio: ${extraction.store ?? 'No detectado'}`)
      adminLines.push(`📅 Fecha: ${extraction.date ? formatDate(extraction.date) : 'No detectada'}`)
      adminLines.push(`💶 Total: ${extraction.amount != null ? `${extraction.amount.toFixed(2)} €` : 'No detectado'}`)
      adminLines.push(`💳 Pago: ${extraction.payment_method ?? 'No detectado'}`)
      await sendAdminNotification(notificationAdminId, adminLines.join('\n'), env.TELEGRAM_BOT_TOKEN)
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
  env: Env
): Promise<void> {
  if (!photos) return

  // Pick the largest resolution photo (last in array)
  const largestPhoto = photos[photos.length - 1]
  if (!largestPhoto) return

  try {
    // Resolve the recipient independently from ticket processing. Failure to
    // resolve it must never cause a saved ticket to be reported as failed.
    const notificationAdminId = await resolveNotificationAdmin(env, userId, isAdmin)

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
      telegram_user_id: userId,
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

    // 6. Notify only the explicitly assigned account admin.
    if (notificationAdminId !== null) {
      const adminLines: string[] = [`🔔 <b>Nuevo ticket de usuario <code>${userId}</code></b>`, '']
      adminLines.push(`🏪 Comercio: ${extraction.store ?? 'No detectado'}`)
      adminLines.push(`📅 Fecha: ${extraction.date ? formatDate(extraction.date) : 'No detectada'}`)
      adminLines.push(`💶 Total: ${extraction.amount != null ? `${extraction.amount.toFixed(2)} €` : 'No detectado'}`)
      adminLines.push(`💳 Pago: ${extraction.payment_method ?? 'No detectado'}`)
      await sendAdminNotification(notificationAdminId, adminLines.join('\n'), env.TELEGRAM_BOT_TOKEN)
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

function parseTelegramId (value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

async function resolveNotificationAdmin (env: Env, userId: number): Promise<number | null> {
  try {
    const user = await getAllowedUser(env.DB, userId)
    const adminId = user?.account_admin_id
    return adminId != null && adminId !== userId ? adminId : null
  } catch (err) {
    console.error('Could not resolve ticket notification admin:', err)
    return null
  }
}

async function getAccountAdminId (db: D1Database, userId: number): Promise<number | null> {
  const user = await getAllowedUser(db, userId)
  return user?.account_admin_id ?? null
}

async function sendAdminNotification (adminId: number, message: string, token: string): Promise<void> {
  try {
    await sendTelegramMessage(adminId, message, token)
  } catch (err) {
    console.error('Could not send ticket notification to account admin:', err)
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
