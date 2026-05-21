import type { GeminiExtraction } from '../types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const SYSTEM_SCHEMA = `Devuelve un objeto JSON con los siguientes campos:
- "date": Fecha en formato "YYYY-MM-DD" (ejemplo: "2026-04-02") o null si no hay.
- "store": Nombre del comercio o null.
- "amount": Importe total como decimal o null.
- "payment_method": Método de pago ("efectivo", "tarjeta", etc.) o null.`

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
 * Converts a "YYYY-MM-DD" date string to a Unix timestamp in milliseconds.
 * Uses 12:00 UTC to avoid any timezone-related date shifts.
 */
function parseDateString (dateStr: string | null): number | null {
  if (!dateStr) return null
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, year, month, day] = match
  // Use noon UTC to prevent day boundary issues across timezones
  const ts = Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0)
  return isNaN(ts) ? null : ts
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
      date: parseDateString(parsed.date),
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
      date: parseDateString(parsed.date),
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
