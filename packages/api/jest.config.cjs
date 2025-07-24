/** @type {import('jest').Config} */
module.exports = {
  preset: '@shelf/jest-mongodb',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    'test/**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**'
  ]
}
