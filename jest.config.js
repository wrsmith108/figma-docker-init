export default {
  preset: null,
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/test/**/*.test.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'figma-docker-init.js',
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
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true
};