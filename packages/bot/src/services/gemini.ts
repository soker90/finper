import type { GeminiExtraction } from '../types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const SYSTEM_SCHEMA = `Devuelve un objeto JSON con los siguientes campos:
- "date_raw": Fecha exactamente como aparece en el texto o imagen, por ejemplo "04/10/2026", o null si no hay.
- "date": Fecha normalizada en formato "YYYY-MM-DD" o null si no hay. En tickets españoles, las fechas numéricas usan siempre el formato DD/MM/YYYY (día/mes/año). Por ejemplo, "04/10/2026" significa "2026-10-04", nunca "2026-04-10".
- "store": Nombre del comercio o null.
- "amount": Importe total como decimal o null.
- "payment_method": Método de pago ("efectivo", "tarjeta", etc.) o null.

Para imágenes de tickets, identifica preferentemente la fecha asociada a etiquetas como "FECHA", "FECHA FACTURA", "FECHA COMPRA" o equivalentes. Conserva en "date_raw" exactamente el orden día/mes/año que aparece en el ticket. La aplicación validará y normalizará las fechas numéricas por separado.`

const IMAGE_EXTRACTION_PROMPT = `Analiza esta imagen de un ticket/recibo e identifica los datos. ${SYSTEM_SCHEMA}`

const TEXT_EXTRACTION_PROMPT = `Analiza este gasto descrito por el usuario e identifica los datos solicitados. ${SYSTEM_SCHEMA}`

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
  }>
}

interface GeminiRawExtraction {
  date: string | null
  date_raw?: string | null
  store: string | null
  amount: number | null
  payment_method: string | null
}

/**
 * Converts a receipt date to a Unix timestamp in milliseconds.
 *
 * Numeric dates from Spanish receipts are interpreted as DD/MM/YYYY,
 * while ISO dates are accepted as a fallback for Gemini's normalized value.
 * Uses 12:00 UTC to avoid timezone-related date shifts.
 */
function parseDateString (dateRaw: string | null, dateFallback: string | null = null): number | null {
  const normalizedRawDate = dateRaw?.trim() ?? ''

  const numericMatch = normalizedRawDate.match(/^(\\d{1,2})[\\/. -](\\d{1,2})[\\/. -](\\d{2}|\\d{4})$/)
  if (numericMatch) {
    const [, dayText, monthText, yearText] = numericMatch
    const day = Number(dayText)
    const month = Number(monthText)
    const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText)
    return createValidatedTimestamp(year, month, day)
  }

  const isoMatch = normalizedRawDate.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/)
  if (isoMatch) {
    const [, yearText, monthText, dayText] = isoMatch
    return createValidatedTimestamp(Number(yearText), Number(monthText), Number(dayText))
  }

  if (dateFallback) {
    const fallbackMatch = dateFallback.trim().match(/^(\\d{4})-(\\d{2})-(\\d{2})$/)
    if (fallbackMatch) {
      const [, yearText, monthText, dayText] = fallbackMatch
      return createValidatedTimestamp(Number(yearText), Number(monthText), Number(dayText))
    }
  }

  return null
}

function createValidatedTimestamp (year: number, month: number, day: number): number | null {
  const timestamp = Date.UTC(year, month - 1, day, 12, 0, 0)
  const parsedDate = new Date(timestamp)

  if (
    isNaN(timestamp) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null
  }

  return timestamp
}

/**
 * Sends an image to Gemini Flash Vision and extracts receipt data
 */
export async function extractReceiptData (
  imageBuffer: ArrayBuffer,
  apiKey: string
): Promise<GeminiExtraction> {
  const base64Image = arrayBufferToBase64(imageBuffer)

  const requestBody = {
    contents: [
      {
        parts: [
          { text: IMAGE_EXTRACTION_PROMPT },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  }

  const text = await callGemini(requestBody, apiKey)

  try {
    const cleaned = text.trim().replace(/^\`\`\`(?:json)?\\s*/i, '').replace(/\\s*\`\`\`$/, '')
    const parsed = JSON.parse(cleaned) as GeminiRawExtraction
    return {
      date: parseDateString(parsed.date_raw ?? null, parsed.date),
      store: parsed.store ?? null,
      amount: parsed.amount ?? null,
      raw_text: '',
      payment_method: parsed.payment_method ?? null
    }
  } catch {
    console.error('Failed to parse Gemini JSON response:', text)
    return { date: null, store: null, amount: null, raw_text: '', payment_method: null }
  }
}

/**
 * Sends a free-text expense description to Gemini and extracts structured data
 */
export async function extractExpenseFromText (
  userText: string,
  apiKey: string
): Promise<GeminiExtraction> {
  const requestBody = {
    contents: [
      {
        parts: [
          { text: TEXT_EXTRACTION_PROMPT },
          { text: `Mensaje: "${userText}"` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
      responseMimeType: 'application/json'
    }
  }

  const text = await callGemini(requestBody, apiKey)

  try {
    const cleaned = text.trim().replace(/^\`\`\`(?:json)?\\s*/i, '').replace(/\\s*\`\`\`$/, '')
    const parsed = JSON.parse(cleaned) as GeminiRawExtraction
    return {
      date: parseDateString(parsed.date_raw ?? null, parsed.date),
      store: parsed.store ?? null,
      amount: parsed.amount ?? null,
      raw_text: userText,
      payment_method: parsed.payment_method ?? null
    }
  } catch {
    console.error('Failed to parse Gemini JSON response:', text)
    return { date: null, store: null, amount: null, raw_text: userText, payment_method: null }
  }
}

async function callGemini (requestBody: unknown, apiKey: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errorText}`)
  }

  const data = await response.json() as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini returned empty response')
  }

  return text
}

function arrayBufferToBase64 (buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}
