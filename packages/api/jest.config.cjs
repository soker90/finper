/** @type {import('jest').Config} */
module.exports = {
  preset: '@shelf/jest-mongodb',
  transform: {
    '^.+\\.ts?$': ['ts-jest', { diagnostics: false }],
    '^.+\\.js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm|@faker-js/faker)/)',
    '/node_modules/\\.pnpm/(?!(@faker-js\\+faker)@)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!src/scripts/**',
    '!src/helpers/hash-password.ts',
    '!src/middlewares/logger.ts',
    '!src/auth/jwt-strategy-passport-handler.ts',
    '!src/auth/local-strategy-passport-handler.ts'
  ]
}
