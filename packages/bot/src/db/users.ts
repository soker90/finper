export interface AllowedUser {
  user_id: number
  added_by: number
  added_at: number
}

/**
 * Returns true if the given userId is allowed to use the bot.
 * The admin (checked separately via env var) is always allowed and is NOT
 * stored in this table.
 */
export async function isUserAllowed (db: D1Database, userId: number): Promise<boolean> {
  const result = await db
    .prepare('SELECT 1 FROM allowed_users WHERE user_id = ?')
    .bind(userId)
    .first()
  return result !== null
}

/**
 * Adds a user to the allowed list. Returns false if the user was already present.
 */
export async function addAllowedUser (
  db: D1Database,
  userId: number,
  addedBy: number
): Promise<boolean> {
  try {
    await db
      .prepare('INSERT INTO allowed_users (user_id, added_by, added_at) VALUES (?, ?, ?)')
      .bind(userId, addedBy, Date.now())
      .run()
    return true
  } catch {
    // UNIQUE constraint violation — user already exists
    return false
  }
}

/**
 * Removes a user from the allowed list. Returns false if the user was not present.
 */
export async function removeAllowedUser (
  db: D1Database,
  userId: number
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM allowed_users WHERE user_id = ?')
    .bind(userId)
    .run()
  return (result.meta.changes ?? 0) > 0
}

/**
 * Returns all users in the allowed list, ordered by when they were added.
 */
export async function listAllowedUsers (db: D1Database): Promise<AllowedUser[]> {
  const result = await db
    .prepare('SELECT user_id, added_by, added_at FROM allowed_users ORDER BY added_at ASC')
    .all<AllowedUser>()
  return result.results
}
