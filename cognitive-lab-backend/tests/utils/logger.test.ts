// tests/utils/logger.test.ts
import { logger } from '../../src/utils/logger';

describe('Logger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug', () => {
    it('should log debug messages when level is debug', () => {
      logger.debug('Test debug message', { key: 'value' });

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Test debug message',
        { key: 'value' }
      );
    });

    it('should log debug messages without metadata', () => {
      logger.debug('Test debug message');

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Test debug message',
        ''
      );
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message', { key: 'value' });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test info message',
        { key: 'value' }
      );
    });

    it('should log info messages without metadata', () => {
      logger.info('Test info message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test info message',
        ''
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message', { key: 'value' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Test warning message',
        { key: 'value' }
      );
    });

    it('should log warning messages without metadata', () => {
      logger.warn('Test warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Test warning message',
        ''
      );
    });
  });

  describe('error', () => {
    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        error
      );
    });

    it('should log error messages with plain object', () => {
      const errorData = { code: 'TEST_ERROR', details: 'Test details' };
      logger.error('Test error message', errorData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        errorData
      );
    });

    it('should log error messages without error object', () => {
      logger.error('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        ''
      );
    });
  });
});
