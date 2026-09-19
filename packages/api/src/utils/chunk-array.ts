/** Splits an array into chunks of at most `size` items each. Used to keep
 * SQLite `IN (...)` queries under the engine's bound-parameter limit (32766
 * on modern builds, 999 on older ones) when the id list comes from an
 * unbounded source (e.g. all of a user's transactions). */
export const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}
