import type { TelegramFile } from '../types'

/**
 * Downloads the highest resolution photo from a Telegram message
 * Returns the file as an ArrayBuffer
 */
export async function downloadTelegramPhoto (
  fileId: string,
  botToken: string
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  // Step 1: Get file path from Telegram
  const fileResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
  )

  if (!fileResponse.ok) {
    throw new Error(`Failed to get file info from Telegram: ${fileResponse.status}`)
  }

  const fileData = await fileResponse.json() as { ok: boolean; result: TelegramFile }

  if (!fileData.ok) {
    throw new Error('Telegram getFile returned ok=false')
  }

  // Step 2: Download the actual file
  const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
  const downloadResponse = await fetch(downloadUrl)

  if (!downloadResponse.ok) {
    throw new Error(`Failed to download file from Telegram: ${downloadResponse.status}`)
  }

  const buffer = await downloadResponse.arrayBuffer()
  return { buffer, mimeType: 'image/jpeg' }
}

/**
 * Sends a text message to a Telegram chat
 */
export async function sendTelegramMessage (
  chatId: number,
  text: string,
  botToken: string
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  })
}
