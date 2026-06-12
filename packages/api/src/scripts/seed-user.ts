import 'dotenv/config'
import { db as sqliteDb } from '../db'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import { usersService } from '../modules/users/users.service'
import { MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from '../config/inputs'

const username = (process.env.INIT_USERNAME ?? '').toLowerCase().trim()
const password = process.env.INIT_PASSWORD ?? ''

function validate (): void {
  if (!username || username.length < MIN_LENGTH_USERNAME || username.length > MAX_USERNAME_LENGTH) {
    console.error(
      `❌  INIT_USERNAME es obligatorio y debe tener entre ${MIN_LENGTH_USERNAME} y ${MAX_USERNAME_LENGTH} caracteres.`
    )
    process.exit(1)
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    console.error(`❌  INIT_PASSWORD es obligatorio y debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    process.exit(1)
  }
}

async function seed (): Promise<void> {
  validate()

  migrate(sqliteDb as any, {
    migrationsFolder: path.resolve(__dirname, '../../../db/drizzle')
  })

  try {
    await usersService.createUser({ username, password })
    console.log('✅  Usuario creado correctamente.')
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      console.log('ℹ️   El usuario ya existe. No se realizaron cambios.')
    } else {
      console.error('❌  Error inesperado:', err)
      process.exit(1)
    }
  }

  process.exit(0)
}

seed().catch((err: unknown) => {
  console.error('❌  Error inesperado:', err)
  process.exit(1)
})
