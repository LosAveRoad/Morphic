// src/utils/logger.ts
import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = config.logging.level as LogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  }
}

export const logger = new Logger();
