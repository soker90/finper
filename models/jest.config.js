/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  bail: true,
  testEnvironment: '<rootDir>/test/mongo-test-environment',
  setupFilesAfterEnv: [
    '<rootDir>/test/bootstrap-jest.js'
  ],
  coverageReporters: [
    'json',
    'text-summary',
    'lcov',
    'clover'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/models/**'
  ],
  coveragePathIgnorePatterns: [],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
}
