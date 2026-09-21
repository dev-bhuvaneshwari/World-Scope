/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  moduleFileExtensions: ['js', 'json'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['services/**/*.js', 'controllers/**/*.js', 'utils/**/*.js'],
};
