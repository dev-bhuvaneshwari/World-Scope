import { jest, beforeEach } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
