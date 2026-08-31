/** @type {import('jest').Config} */
module.exports = {
  setupFiles: ['<rootDir>/jest.setup.ts'],
  coverageProvider: 'v8',
  transform: {
    '^.+\\.ts$': ['@swc/jest', {
      sourceMaps: true,
      module: { type: 'commonjs' },
      jsc: { parser: { syntax: 'typescript' }, target: 'es2022' }
    }],
    '^.+\\.js$': ['@swc/jest', {
      sourceMaps: true,
      module: { type: 'commonjs' },
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm|@faker-js/faker)/)',
    '/node_modules/\\.pnpm/(?!(@faker-js\\+faker)@)'
  ],
  moduleNameMapper: {
    '^@soker90/finper-db$': '<rootDir>/../db/src/index.ts'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!src/**/*.types.ts',
    '!src/types/**',
    '!src/scripts/**',
    '!src/helpers/hash-password.ts',
    '!src/middlewares/logger.ts',
    '!src/auth/jwt-strategy-passport-handler.ts',
    '!src/auth/local-strategy-passport-handler.ts'
  ]
}
