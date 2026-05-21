import type { Mongoose } from 'mongoose'

export default (mongoose: Mongoose) => {
  async function connect () {
    await mongoose.connect((global as unknown as Record<string, string>).__MONGO_URI__)
  }

  async function close () {
    await mongoose.connection.close()
  }

  async function clear () {
    await mongoose.connection.db?.dropDatabase()
  }

  return {
    clear,
    close,
    connect
  }
}
