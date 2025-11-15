export default {
  preset: null,
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)',
  ],
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'vibe-to-docker.js',
    'src/**/*.js',
    '!src/**/*.test.js',
    '!node_modules/**',
    '!coverage/**',
    '!**/*.config.js',
    '!**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 69,
      lines: 62,
      statements: 62
    }
  },
  verbose: true
};