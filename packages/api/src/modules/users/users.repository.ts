import { type DB, schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

const { users } = schema

export const createUsersRepository = (db: DB) => ({
  findByUsername: (username: string) => {
    return db.select().from(users).where(eq(users.username, username)).get() ?? null
  },
  existsByUsername: (username: string) => {
    const user = db.select().from(users).where(eq(users.username, username)).get()
    return user !== undefined
  },
  create: (data: { username: string, passwordHash: string }) => {
    return db.insert(users).values({
      id: generateId(),
      username: data.username,
      password: data.passwordHash,
      createdAt: new Date()
    }).returning().get()
  }
})

import { db as defaultDb } from '../../db'
export const usersRepository = createUsersRepository(defaultDb)
