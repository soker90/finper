export interface AllowedUser {
  user_id: number
  added_by: number
  notification_admin_id: number | null
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
 * Returns the access record for a Telegram user, including the admin who
 * authorized them. Returns null when the user is not registered.
 */
export async function getAllowedUser (db: D1Database, userId: number): Promise<AllowedUser | null> {
  return await db
    .prepare('SELECT user_id, added_by, notification_admin_id, added_at, finper_username FROM allowed_users WHERE user_id = ?')
    .bind(userId)
    .first<AllowedUser>()
}

/**
 * Adds a user to the allowed list, linked to a Finper username. Several Telegram
 * users can be linked to the same Finper username. Returns false if the user
 * was already present.
 */
export async function addAllowedUser (
  db: D1Database,
  userId: number,
  addedBy: number,
  finperUsername: string,
  notificationAdminId: number
): Promise<boolean> {
  try {
    await db
      .prepare('INSERT INTO allowed_users (user_id, added_by, notification_admin_id, added_at, finper_username) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, addedBy, notificationAdminId, Date.now(), finperUsername)
      .run()
    return true
  } catch {
    // UNIQUE constraint violation — user already exists
    return false
  }
}

/**
 * Changes the account administrator that receives ticket notifications.
 * Returns false when the Telegram user is not registered.
 */
export async function setNotificationAdmin (
  db: D1Database,
  userId: number,
  notificationAdminId: number
): Promise<boolean> {
  const result = await db
    .prepare('UPDATE allowed_users SET notification_admin_id = ? WHERE user_id = ?')
    .bind(notificationAdminId, userId)
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
    .prepare('SELECT user_id, added_by, notification_admin_id, added_at, finper_username FROM allowed_users ORDER BY added_at ASC')
    .all<AllowedUser>()
  return result.results
}
