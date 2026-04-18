// tests/setup.ts
// Jest test setup file
// Configure test environment globally

// Set test timeout for all tests
jest.setTimeout(10000);

// Mock environment variables for testing
process.env.DEEPSEEK_API_KEY = 'test-api-key';
process.env.DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
process.env.DEEPSEEK_MODEL = 'deepseek-chat';
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';
process.env.REDIS_ENABLED = 'false';
process.env.DATABASE_URL = 'file:./dev.db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
