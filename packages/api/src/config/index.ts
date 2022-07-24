export default {
  port: 3008,
  mongo: {
    host: [process.env.DATABASE_HOST || '127.0.0.1'], // list of hosts
    port: '27017', // list of ports
    hasPort: false,
    databaseName: process.env.DATABASE_NAME || 'test',
    mongoUri: process.env.MONGODB,
    options: {},
    user: process.env.MONGODB_USER || '',
    pass: process.env.MONGODB_PASS || ''
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'test',
    saltRounds: process.env.SALT_ROUNDS || '10',
    timeout: '1h'
  },
  logger: {
    loki: {
      isActive: true,
      user: process.env.GRAFANA_LOGGER_USER || 'test',
      job: 'test',
      host: 'https://logs-prod-eu-west-0.grafana.net',
      password: process.env.GRAFANA_LOGGER_PASSWORD || 'test'
    }
  }
}
