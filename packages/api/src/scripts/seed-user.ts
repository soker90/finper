import 'dotenv/config'
import { UserModel, mongoose } from '@soker90/finper-models'
import config from '../config'
import db from '../config/db'
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

  db.connect(config.mongo)

  await new Promise<void>((resolve, reject) => {
    mongoose.connection.once('connected', resolve)
    mongoose.connection.once('error', reject)
  })

  const existing = await UserModel.findOne({ username })

  if (existing) {
    console.log(`ℹ️   El usuario "${username}" ya existe. No se realizaron cambios.`)
    await mongoose.connection.close()
    process.exit(0)
  }

  await UserModel.create({ username, password })
  console.log(`✅  Usuario "${username}" creado correctamente.`)

  await mongoose.connection.close()
  process.exit(0)
}

seed().catch((err: unknown) => {
  console.error('❌  Error inesperado:', err)
  process.exit(1)
})
