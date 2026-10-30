export interface AllowedUser {
  user_id: number
  added_by: number
  account_admin_id: number | null
  added_at: number
  finper_username: string | null
}

/**
 * Returns true if the given userId is allowed to use the bot.
 * The admin (checked separately via env var) is always allowed regardless
 * of whether it has a row in this table. The admin can still be added here
 * (via /adduser) purely to link its Telegram ID to a Finper username, so its
 * own tickets are filterable too.
 */
export async function isUserAllowed (db: D1Database, userId: number): Promise<boolean> {
  const result = await db
    .prepare('SELECT 1 FROM allowed_users WHERE user_id = ?')
    .bind(userId)
    .first()
  return result !== null
}

/**
 * Returns the access record for a Telegram user, including the first linked
 * user of the same Finper account. Returns null when the user is not registered.
 */
export async function getAllowedUser (db: D1Database, userId: number): Promise<AllowedUser | null> {
  return await db
    .prepare('SELECT user_id, added_by, added_at, finper_username, (SELECT admin.user_id FROM allowed_users admin WHERE admin.finper_username = allowed_users.finper_username ORDER BY admin.added_at ASC, admin.user_id ASC LIMIT 1) AS account_admin_id FROM allowed_users WHERE user_id = ?')
    .bind(userId)
    .first<AllowedUser>()
}

/**
 * Adds a user to the allowed list, linked to a Finper username. The first user
 * linked to each username automatically becomes that account's administrator.
 */
export async function addAllowedUser (
  db: D1Database,
  userId: number,
  addedBy: number,
  finperUsername: string
): Promise<boolean> {
  const result = await db
    .prepare('INSERT OR IGNORE INTO allowed_users (user_id, added_by, added_at, finper_username) VALUES (?, ?, ?, ?)')
    .bind(userId, addedBy, Date.now(), finperUsername)
    .run()
  return (result.meta.changes ?? 0) > 0
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
    .prepare('SELECT user_id, added_by, added_at, finper_username, (SELECT admin.user_id FROM allowed_users admin WHERE admin.finper_username = allowed_users.finper_username ORDER BY admin.added_at ASC, admin.user_id ASC LIMIT 1) AS account_admin_id FROM allowed_users ORDER BY added_at ASC, user_id ASC')
    .all<AllowedUser>()
  return result.results
}
