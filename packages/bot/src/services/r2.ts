/**
 * Uploads an image buffer to Cloudflare R2.
 * Returns the R2 key (path) used to store and later retrieve the object.
 */
export async function uploadToR2 (
  bucket: R2Bucket,
  buffer: ArrayBuffer,
  key: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  await bucket.put(key, buffer, {
    httpMetadata: { contentType: mimeType }
  })
  return key
}

/**
 * Generates the R2 key for a given ticket ID.
 */
export function getR2Key (ticketId: string): string {
  return `tickets/${ticketId}.jpg`
}
