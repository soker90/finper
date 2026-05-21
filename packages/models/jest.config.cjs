module.exports = {
  preset: '@shelf/jest-mongodb',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/models/**',
    'test/**'
  ],
  roots: [
    'src',
    'test'
  ]
}
