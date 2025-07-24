/** @type {import('jest').Config} */
module.exports = {
  preset: '@shelf/jest-mongodb',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['<rootDir>/test/**/*test.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    'test/**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**'
  ]
}
