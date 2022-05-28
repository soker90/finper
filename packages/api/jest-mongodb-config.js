module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      skipMD5: true,
      version: '4.0.3', // Version of MongoDB
    },
    autoStart: false,
    instance: {},
  },
  useSharedDBForAllJestWorkers: false,
};