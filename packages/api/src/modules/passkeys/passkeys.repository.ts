import type { DB } from '@soker90/finper-db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { db } from '../../db'

const { passkeys } = schema

export type NewPasskeyInput = {
  credentialId: string
  publicKey: string
  counter: number
  transports?: string
  deviceLabel?: string
}

export const createPasskeysRepository = (database: DB) => ({
  findAllByUsername: (username: string) =>
    database.select().from(passkeys).where(eq(passkeys.user, username)).all(),

  findByCredentialId: (credentialId: string) => {
    const row = database.select().from(passkeys).where(eq(passkeys.credentialId, credentialId)).get()
    return row ?? null
  },

  create: (username: string, data: NewPasskeyInput) => {
    const row = { ...data, id: generateId(), user: username, createdAt: new Date() }
    database.insert(passkeys).values(row).run()
    return row
  },

  updateCounter: (credentialId: string, counter: number) => {
    database.update(passkeys).set({ counter }).where(eq(passkeys.credentialId, credentialId)).run()
  }
})

export type PasskeysRepository = ReturnType<typeof createPasskeysRepository>
export const passkeysRepository = createPasskeysRepository(db)
