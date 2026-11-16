import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const resolveChallengeTokenSecret = (): string => {
  const secret = process.env.WEBAUTHN_CHALLENGE_SECRET || process.env.JWT_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production' && process.env.SERVE_CLIENT !== 'true') {
    throw new Error('WEBAUTHN_CHALLENGE_SECRET or JWT_SECRET must be set in production')
  }
  return 'test'
}

const resolveDatabasePath = (): string => {
  if (process.env.DATABASE_FILE) return process.env.DATABASE_FILE
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'dev') return './finper-dev.db'

  const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')
  const finperDir = path.join(xdgDataHome, 'finper')
  try {
    if (!fs.existsSync(finperDir)) {
      fs.mkdirSync(finperDir, { recursive: true })
    }
    return path.join(finperDir, 'finper.db')
  } catch {
    return './finper-dev.db'
  }
}

const clientDistPath = process.env.CLIENT_DIST_PATH || path.resolve(__dirname, '../../../client/dist')

export default {
  port: 3008,
  client: {
    serve: process.env.SERVE_CLIENT === 'true',
    distPath: clientDistPath
  },
  cors: {
    allowedOrigins: [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https?:\/\/192\.168\.1\.\d{1,3}(:\d+)?$/
    ]
  },
  allowRegistration: process.env.ALLOW_REGISTRATION === 'true',
  database: {
    file: resolveDatabasePath()
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'test',
    saltRounds: process.env.SALT_ROUNDS || '10',
    timeout: '30m'
  },
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'Finper',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    expectedOrigin: (process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173,http://localhost:3008')
      .split(',').map(origin => origin.trim()),
    challengeTokenSecret: resolveChallengeTokenSecret(),
    challengeTokenTtl: '5m'
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
