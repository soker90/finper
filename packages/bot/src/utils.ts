/**
 * Generates a random URL-safe ID (UUID v4 style without hyphens)
 */
export function generateId (): string {
  return crypto.randomUUID().replace(/-/g, '')
}
