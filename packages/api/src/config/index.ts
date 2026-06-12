export default {
  port: 3008,
  database: {
    file: process.env.DATABASE_FILE || './finper-dev.db'
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
  },
  tariffs: {
    apiUrl: 'https://soker90.github.io/tarifas-luz/tarifas.json',
    cacheDurationMs: 12 * 60 * 60 * 1000 // 12 hours
  },
  stocks: {
    cacheDurationMs: 10 * 60 * 1000 // 10 minutes
  }
}
