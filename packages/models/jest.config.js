module.exports = {
  preset: '@shelf/jest-mongodb',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/models/**',
    'test/**'
  ]
}
