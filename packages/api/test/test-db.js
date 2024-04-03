module.exports = (mongoose) => {
  async function connect () {
    await mongoose.connect(global.__MONGO_URI__)
  }

  async function close () {
    await mongoose.connection.close()
  }

  async function cleanAll () {
    await mongoose.connection.db.dropDatabase()
  }

  return {
    close,
    connect,
    cleanAll
  }
}
