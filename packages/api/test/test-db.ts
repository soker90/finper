import type { Mongoose } from 'mongoose'
import { db as sqliteDb } from '../src/db'
import { schema } from '@soker90/finper-db'

export default (mongoose: Mongoose) => {
  async function connect () {
    await mongoose.connect((global as unknown as Record<string, string>).__MONGO_URI__)
  }

  async function close () {
    await mongoose.connection.close()
  }

  async function cleanAll () {
    await mongoose.connection.db?.dropDatabase()
  }

  return {
    cleanAll,
    close,
    connect
  }
}
