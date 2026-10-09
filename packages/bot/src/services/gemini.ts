import type { GeminiExtraction } from '../types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const SYSTEM_SCHEMA = `Devuelve un objeto JSON con los siguientes campos:
- "date": Fecha tal como aparece en el texto o imagen, por ejemplo "04/10/2026", o null si no hay. En tickets españoles, las fechas numéricas usan el formato DD/MM/YYYY (día/mes/año). No conviertas ni intercambies el día y el mes. También se aceptan fechas ISO en formato "YYYY-MM-DD".
- "store": Nombre del comercio o null.
- "amount": Importe total como decimal o null.
- "payment_method": Método de pago ("efectivo", "tarjeta", etc.) o null.

Para imágenes de tickets, identifica preferentemente la fecha asociada a etiquetas como "FECHA", "FECHA FACTURA", "FECHA COMPRA" o equivalentes. Conserva la fecha exactamente como aparece en el ticket. La aplicación validará y normalizará las fechas por separado.`

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
  store: string | null
  amount: number | null
  payment_method: string | null
}

/**
 * Converts a receipt date to a Unix timestamp in milliseconds.
 *
 * Numeric dates from Spanish receipts are interpreted as DD/MM/YYYY.
 * ISO dates are also accepted. Uses 12:00 UTC to avoid timezone-related date shifts.
 */
function parseDateString (dateValue: string | null, referenceTimestamp = Date.now()): number | null {
  const date = dateValue?.trim() ?? ''

  const numericMatch = date.match(/^(\d{1,2})[\\/. -](\d{1,2})[\\/. -](\d{2}|\d{4})$/)
  if (numericMatch) {
    const [, dayText, monthText, yearText] = numericMatch
    if (!dayText || !monthText || !yearText) return null
    const first = Number(dayText)
    const second = Number(monthText)
    const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText)
    const dayFirst = createValidatedTimestamp(year, second, first)
    const monthFirst = createValidatedTimestamp(year, first, second)

    if (dayFirst === null) return monthFirst
    if (monthFirst === null || first === second) return dayFirst

    const referenceDate = new Date(referenceTimestamp)
    const referenceYear = referenceDate.getUTCFullYear()
    const candidates = [
      createValidatedTimestamp(referenceYear, second, first),
      createValidatedTimestamp(referenceYear, first, second)
    ].filter((candidate): candidate is number => candidate !== null)
    const recentCandidates = candidates.filter(candidate =>
      Math.abs(candidate - referenceTimestamp) <= 45 * 24 * 60 * 60 * 1000
    )

    if (recentCandidates.length === 1) return recentCandidates[0]!
    if (recentCandidates.length > 1) {
      return recentCandidates.reduce((closest, candidate) =>
        Math.abs(candidate - referenceTimestamp) < Math.abs(closest - referenceTimestamp) ? candidate : closest
      )
    }

    return dayFirst
  }

  const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, yearText, monthText, dayText] = isoMatch
    if (!yearText || !monthText || !dayText) return null
    return createValidatedTimestamp(Number(yearText), Number(monthText), Number(dayText))
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
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(cleaned) as GeminiRawExtraction
    return {
      date: parseDateString(parsed.date, referenceTimestamp),
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
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(cleaned) as GeminiRawExtraction
    return {
      date: parseDateString(parsed.date, referenceTimestamp),
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
