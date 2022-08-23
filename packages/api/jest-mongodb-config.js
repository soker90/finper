module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      skipMD5: true,
      version: '4.4.16' // Version of MongoDB
    },
    autoStart: false,
    instance: {}
  },
  useSharedDBForAllJestWorkers: false
}
